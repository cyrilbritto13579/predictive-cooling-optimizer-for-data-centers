import type { SimulationFrame, SimulationStepResponse } from '../types';
import { ApiError } from '../api/client';
import { env } from '../config/environment';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'error';

export interface SimulationControllerState {
  playbackStatus: PlaybackStatus;
  currentFrame: SimulationFrame | null;
  chartHistory: SimulationFrame[];
  currentStepIndex: number;
  nextStepIndex: number;
  totalSteps: number;
  isLoading: boolean;
  error: string | null;
  errorDetail: string | null;
  stepError: string | null;
}

export interface SimulationApiClient {
  getSampleTotalRows: () => Promise<number>;
  step: (index: number) => Promise<SimulationStepResponse>;
}

export interface ControllerConfig {
  stepIntervalMs?: number;
  maxHistory?: number;
}

export class SimulationPlaybackController {
  private state: SimulationControllerState;
  private listeners: Set<(state: SimulationControllerState) => void> = new Set();
  private initialFrame: SimulationFrame | null = null;
  private isPlaying: boolean = false;
  private inFlight: boolean = false;
  private runId: number = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly stepIntervalMs: number;
  private readonly maxHistory: number;
  private readonly api: SimulationApiClient;

  constructor(api: SimulationApiClient, config?: ControllerConfig) {
    this.api = api;
    this.stepIntervalMs = config?.stepIntervalMs ?? 1000;
    this.maxHistory = config?.maxHistory ?? 100;

    this.state = {
      playbackStatus: 'idle',
      currentFrame: null,
      chartHistory: [],
      currentStepIndex: 0,
      nextStepIndex: 1,
      totalSteps: 100,
      isLoading: true,
      error: null,
      errorDetail: null,
      stepError: null,
    };
  }

  public getState(): SimulationControllerState {
    return this.state;
  }

  public subscribe(listener: (state: SimulationControllerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<SimulationControllerState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public async init(): Promise<void> {
    this.clearTimer();
    this.isPlaying = false;
    this.inFlight = false;
    this.runId++;
    const currentRunId = this.runId;

    this.updateState({
      isLoading: true,
      error: null,
      errorDetail: null,
      stepError: null,
      playbackStatus: 'idle',
    });

    try {
      const total = await this.api.getSampleTotalRows();
      if (typeof total !== 'number' || total <= 0) {
        throw new Error('Invalid sample dataset total rows.');
      }

      const step0 = await this.api.step(0);
      if (this.runId !== currentRunId) return;

      this.initialFrame = step0.frame;
      this.updateState({
        totalSteps: total,
        currentFrame: step0.frame,
        chartHistory: [step0.frame],
        currentStepIndex: step0.frame.step_index,
        nextStepIndex: step0.next_state.current_index,
        isLoading: false,
        error: null,
        errorDetail: null,
        playbackStatus: 'idle',
      });
    } catch (err: unknown) {
      if (this.runId !== currentRunId) return;
      let msg = 'Initialization failed.';
      let detail = 'Please verify the backend service is running and accessible.';

      if (err instanceof ApiError) {
        if (err.statusCode === 408 || err.errorType === 'TimeoutError') {
          msg = 'Backend service request timed out.';
          detail =
            'The server took too long to respond. If running on a free cloud tier (e.g., Render), the instance may be waking up from sleep. Please retry in a few moments.';
        } else if (err.statusCode === 0 || err.errorType === 'NetworkError') {
          msg = 'Unable to connect to backend service.';
          const origin = typeof window !== 'undefined' ? window.location.origin : 'this client';
          detail = `Could not connect to ${env.apiBaseUrl}. Ensure the backend service is operational, reachable, and CORS permissions allow requests from ${origin}.`;
        } else if (err.statusCode === 404) {
          msg = 'Simulation endpoint not found (HTTP 404).';
          detail = `The sample data or simulation endpoint was not found at ${env.apiBaseUrl}. Verify API base URL routing and endpoint paths.`;
        } else if (err.statusCode >= 500) {
          msg = `Backend service error (HTTP ${err.statusCode}).`;
          detail = err.detail || 'The server encountered an error while retrieving simulation telemetry.';
        } else {
          msg = `API request failed (HTTP ${err.statusCode}).`;
          detail = err.detail || 'The server rejected the simulation request.';
        }
      } else if (err instanceof Error) {
        msg = err.message;
        detail = 'Invalid or unexpected data received during simulation initialization.';
      }

      this.updateState({
        isLoading: false,
        error: msg,
        errorDetail: detail,
        playbackStatus: 'error',
      });
    }
  }

  public start(): void {
    if (this.state.isLoading || this.state.error || this.isPlaying) {
      return;
    }

    if (this.state.nextStepIndex >= this.state.totalSteps) {
      this.updateState({ playbackStatus: 'completed' });
      return;
    }

    this.isPlaying = true;
    this.updateState({ playbackStatus: 'playing', stepError: null });
    this.clearTimer();
    this.executeStep();
  }

  public pause(): void {
    this.isPlaying = false;
    this.clearTimer();
    this.updateState({ playbackStatus: 'paused' });
  }

  public reset(): void {
    this.runId++;
    this.isPlaying = false;
    this.inFlight = false;
    this.clearTimer();

    if (this.initialFrame) {
      this.updateState({
        playbackStatus: 'idle',
        currentFrame: this.initialFrame,
        chartHistory: [this.initialFrame],
        currentStepIndex: 0,
        nextStepIndex: 1,
        error: null,
        errorDetail: null,
        stepError: null,
      });
    } else {
      this.init();
    }
  }

  public destroy(): void {
    this.runId++;
    this.isPlaying = false;
    this.inFlight = false;
    this.clearTimer();
    this.listeners.clear();
  }

  private async executeStep(): Promise<void> {
    if (!this.isPlaying || this.inFlight) {
      return;
    }

    const targetIndex = this.state.nextStepIndex;
    if (targetIndex >= this.state.totalSteps) {
      this.isPlaying = false;
      this.updateState({ playbackStatus: 'completed' });
      return;
    }

    const currentRunId = this.runId;
    this.inFlight = true;

    try {
      const res = await this.api.step(targetIndex);

      if (this.runId !== currentRunId) {
        return; // discarded (reset or destroyed)
      }

      const newHistory = [...this.state.chartHistory.slice(-(this.maxHistory - 1)), res.frame];

      const isCompleted =
        !res.next_state.is_running || res.next_state.current_index >= this.state.totalSteps;

      if (isCompleted) {
        this.isPlaying = false;
      }

      this.updateState({
        currentFrame: res.frame,
        chartHistory: newHistory,
        currentStepIndex: res.frame.step_index,
        nextStepIndex: res.next_state.current_index,
        playbackStatus: isCompleted ? 'completed' : this.isPlaying ? 'playing' : 'paused',
        stepError: null,
      });

      if (!this.isPlaying || isCompleted) {
        return;
      }

      this.clearTimer();
      this.timer = setTimeout(() => {
        this.executeStep();
      }, this.stepIntervalMs);
    } catch (err: unknown) {
      if (this.runId !== currentRunId) {
        return;
      }

      this.isPlaying = false;
      let msg = 'Step request failed.';
      if (err instanceof ApiError) {
        msg =
          err.statusCode === 0
            ? 'Connection lost during simulation step.'
            : `Step request failed (HTTP ${err.statusCode}): ${err.detail}`;
      } else if (err instanceof Error) {
        msg = err.message;
      }

      this.updateState({
        playbackStatus: 'error',
        stepError: msg,
      });
    } finally {
      this.inFlight = false;
    }
  }
}
