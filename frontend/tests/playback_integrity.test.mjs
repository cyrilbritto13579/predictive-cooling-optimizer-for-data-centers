// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Lightweight mock factory for SimulationFrame and SimulationStepResponse
 */
function makeMockFrame(stepIndex) {
  return {
    step_index: stepIndex,
    predicted_energy_kwh: 120 + stepIndex * 0.5,
    lagged_energy_kwh: 122 + stepIndex * 0.4,
    predicted_temp_c: 30 + (stepIndex % 5) * 0.2,
    lagged_outside_temp_f: 82 + (stepIndex % 3),
    potential_savings_pct: 0.02,
    current_chilled_water_rate: 94.0 - stepIndex * 0.1,
    timestamp: null,
  };
}

function makeMockResponse(stepIndex, totalSteps = 10) {
  const isLast = stepIndex + 1 >= totalSteps;
  return {
    next_state: {
      current_index: stepIndex + 1,
      is_running: !isLast,
      total_steps: totalSteps,
    },
    frame: makeMockFrame(stepIndex),
    optimization: null,
  };
}

/**
 * Import or re-implement controller logic for pure node execution
 */
class SimulationPlaybackControllerTest {
  constructor(api, config) {
    this.api = api;
    this.stepIntervalMs = config?.stepIntervalMs ?? 50;
    this.maxHistory = config?.maxHistory ?? 100;
    this.initialFrame = null;
    this.isPlaying = false;
    this.inFlight = false;
    this.runId = 0;
    this.timer = null;
    this.listeners = new Set();

    this.state = {
      playbackStatus: 'idle',
      currentFrame: null,
      chartHistory: [],
      currentStepIndex: 0,
      nextStepIndex: 1,
      totalSteps: 10,
      isLoading: true,
      error: null,
      errorDetail: null,
      stepError: null,
    };
  }

  getState() {
    return this.state;
  }

  updateState(partial) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async init() {
    this.clearTimer();
    this.isPlaying = false;
    this.inFlight = false;
    this.runId++;
    const currentRunId = this.runId;

    this.updateState({ isLoading: true, error: null, stepError: null, playbackStatus: 'idle' });

    try {
      const total = await this.api.getSampleTotalRows();
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
        playbackStatus: 'idle',
      });
    } catch (err) {
      if (this.runId !== currentRunId) return;
      this.updateState({ isLoading: false, error: err.message, playbackStatus: 'error' });
    }
  }

  start() {
    if (this.state.isLoading || this.state.error || this.isPlaying) return;
    if (this.state.nextStepIndex >= this.state.totalSteps) {
      this.updateState({ playbackStatus: 'completed' });
      return;
    }
    this.isPlaying = true;
    this.updateState({ playbackStatus: 'playing', stepError: null });
    this.clearTimer();
    this.executeStep();
  }

  pause() {
    this.isPlaying = false;
    this.clearTimer();
    this.updateState({ playbackStatus: 'paused' });
  }

  reset() {
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
        stepError: null,
      });
    }
  }

  destroy() {
    this.runId++;
    this.isPlaying = false;
    this.inFlight = false;
    this.clearTimer();
  }

  async executeStep() {
    if (!this.isPlaying || this.inFlight) return;

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
      if (this.runId !== currentRunId) return;

      const isCompleted = !res.next_state.is_running || res.next_state.current_index >= this.state.totalSteps;
      if (isCompleted) {
        this.isPlaying = false;
      }

      const newHistory = [...this.state.chartHistory.slice(-(this.maxHistory - 1)), res.frame];

      this.updateState({
        currentFrame: res.frame,
        chartHistory: newHistory,
        currentStepIndex: res.frame.step_index,
        nextStepIndex: res.next_state.current_index,
        playbackStatus: isCompleted ? 'completed' : this.isPlaying ? 'playing' : 'paused',
        stepError: null,
      });

      if (!this.isPlaying || isCompleted) return;

      this.clearTimer();
      this.timer = setTimeout(() => {
        this.executeStep();
      }, this.stepIntervalMs);
    } catch (err) {
      if (this.runId !== currentRunId) return;
      this.isPlaying = false;
      this.updateState({ playbackStatus: 'error', stepError: err.message });
    } finally {
      this.inFlight = false;
    }
  }
}

// -----------------------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------------------

test('1. Sequential requests: Never issues overlapping simulation step calls even if step takes longer than interval', async () => {
  let inFlightCount = 0;
  let maxConcurrent = 0;
  const calls = [];

  const mockApi = {
    getSampleTotalRows: async () => 10,
    step: async (idx) => {
      inFlightCount++;
      if (inFlightCount > maxConcurrent) maxConcurrent = inFlightCount;
      calls.push({ idx, start: Date.now() });

      // Simulates slow request: 80ms delay, while interval is 20ms
      await new Promise((r) => setTimeout(r, 80));
      inFlightCount--;
      return makeMockResponse(idx, 10);
    },
  };

  const controller = new SimulationPlaybackControllerTest(mockApi, { stepIntervalMs: 20 });
  await controller.init();

  controller.start();
  // Allow time for 3 steps
  await new Promise((r) => setTimeout(r, 320));
  controller.pause();

  assert.equal(maxConcurrent, 1, 'In-flight requests must never exceed 1 concurrently');
  assert.ok(calls.length >= 3, 'Multiple sequential steps executed');
  controller.destroy();
});

test('2. Pause during in-flight: In-flight step completes cleanly but does not schedule next step', async () => {
  let stepCallCount = 0;
  let resolveStep;

  const mockApi = {
    getSampleTotalRows: async () => 10,
    step: async (idx) => {
      stepCallCount++;
      if (idx === 0) return makeMockResponse(0, 10);
      return new Promise((res) => {
        resolveStep = () => res(makeMockResponse(idx, 10));
      });
    },
  };

  const controller = new SimulationPlaybackControllerTest(mockApi, { stepIntervalMs: 30 });
  await controller.init();
  assert.equal(stepCallCount, 1, 'Initial step 0 called');

  controller.start();
  // Step 1 is now in-flight
  assert.equal(stepCallCount, 2, 'Step 1 should be dispatched');

  // User pauses while step 1 is still in flight!
  controller.pause();
  assert.equal(controller.getState().playbackStatus, 'paused');

  // Resolve step 1
  resolveStep();
  await new Promise((r) => setTimeout(r, 80));

  // Step 1 should have updated current frame, but step 2 should NOT have fired
  const state = controller.getState();
  assert.equal(state.currentStepIndex, 1, 'Step 1 should update current frame');
  assert.equal(stepCallCount, 2, 'No further steps should be dispatched after pause');
  assert.equal(state.playbackStatus, 'paused');
  controller.destroy();
});

test('3. Reset during in-flight: Late response cannot overwrite reset state', async () => {
  let resolveStep1;

  const mockApi = {
    getSampleTotalRows: async () => 10,
    step: async (idx) => {
      if (idx === 0) return makeMockResponse(0, 10);
      return new Promise((res) => {
        resolveStep1 = () => res(makeMockResponse(idx, 10));
      });
    },
  };

  const controller = new SimulationPlaybackControllerTest(mockApi, { stepIntervalMs: 30 });
  await controller.init();

  controller.start();
  // Step 1 is in flight
  controller.reset();

  // Reset was triggered: state must be reset to step 0
  assert.equal(controller.getState().currentStepIndex, 0);
  assert.equal(controller.getState().chartHistory.length, 1);
  assert.equal(controller.getState().playbackStatus, 'idle');

  // Now the slow network response for step 1 arrives late!
  resolveStep1();
  await new Promise((r) => setTimeout(r, 60));

  // The late response must have been discarded!
  const state = controller.getState();
  assert.equal(state.currentStepIndex, 0, 'Late response must not overwrite reset index');
  assert.equal(state.chartHistory.length, 1, 'Late response must not append to reset history');
  assert.equal(state.playbackStatus, 'idle', 'Status must remain idle');
  controller.destroy();
});

test('4. End of dataset: Reaching total steps halts playback without duplicate or out-of-range requests', async () => {
  const stepsCalled = [];

  const mockApi = {
    getSampleTotalRows: async () => 4,
    step: async (idx) => {
      stepsCalled.push(idx);
      return makeMockResponse(idx, 4);
    },
  };

  const controller = new SimulationPlaybackControllerTest(mockApi, { stepIntervalMs: 20 });
  await controller.init();
  assert.deepEqual(stepsCalled, [0]);

  controller.start();
  // Wait until all 4 steps finish
  await new Promise((r) => setTimeout(r, 200));

  const state = controller.getState();
  assert.equal(state.playbackStatus, 'completed');
  assert.equal(state.currentStepIndex, 3, 'Last valid index is 3');
  assert.deepEqual(stepsCalled, [0, 1, 2, 3], 'Steps must be [0, 1, 2, 3] strictly without out-of-bounds');
  assert.equal(state.chartHistory.length, 4);

  // Calling start again when completed must not advance out of bounds
  controller.start();
  assert.equal(state.playbackStatus, 'completed');
  assert.deepEqual(stepsCalled, [0, 1, 2, 3], 'No extra calls after completion');
  controller.destroy();
});

test('5. Failed requests: Step failure does not advance sample index or add corrupted chart points', async () => {
  let callCount = 0;

  const mockApi = {
    getSampleTotalRows: async () => 10,
    step: async (idx) => {
      callCount++;
      if (idx === 0) return makeMockResponse(0, 10);
      throw new Error('500 Internal Server Error in XGBoost pipeline');
    },
  };

  const controller = new SimulationPlaybackControllerTest(mockApi, { stepIntervalMs: 20 });
  await controller.init();
  assert.equal(controller.getState().currentStepIndex, 0);
  assert.equal(controller.getState().chartHistory.length, 1);

  controller.start();
  await new Promise((r) => setTimeout(r, 50));

  const state = controller.getState();
  assert.equal(state.playbackStatus, 'error');
  assert.equal(state.stepError, '500 Internal Server Error in XGBoost pipeline');
  assert.equal(state.currentStepIndex, 0, 'Current step index must NOT advance on failure');
  assert.equal(state.chartHistory.length, 1, 'No corrupted chart point added on failure');
  controller.destroy();
});
