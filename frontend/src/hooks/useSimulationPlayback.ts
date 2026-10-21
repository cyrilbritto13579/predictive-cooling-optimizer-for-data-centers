// SPDX-License-Identifier: MIT
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSampleData } from '../api/data';
import { simulationStep } from '../api/simulation';
import type {
  SimulationApiClient,
  SimulationControllerState,
} from './simulationController';
import { SimulationPlaybackController } from './simulationController';

export type { PlaybackStatus } from './simulationController';

export interface UseSimulationPlaybackReturn extends SimulationControllerState {
  startPlayback: () => void;
  pausePlayback: () => void;
  resetPlayback: () => void;
  retryInitialization: () => void;
}

export function useSimulationPlayback(): UseSimulationPlaybackReturn {
  const apiClient: SimulationApiClient = useMemo(
    () => ({
      getSampleTotalRows: async () => {
        const res = await getSampleData(0, 5);
        return res.total_rows;
      },
      step: async (index: number) => {
        return simulationStep({ current_index: index, include_optimization: false });
      },
    }),
    []
  );

  const controllerRef = useRef<SimulationPlaybackController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new SimulationPlaybackController(apiClient, {
      stepIntervalMs: 1000,
      maxHistory: 100,
    });
  }

  const [state, setState] = useState<SimulationControllerState>(() =>
    controllerRef.current!.getState()
  );

  useEffect(() => {
    const controller = controllerRef.current!;
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });

    controller.init();

    return () => {
      unsubscribe();
      controller.destroy();
    };
  }, []);

  return {
    ...state,
    startPlayback: () => controllerRef.current?.start(),
    pausePlayback: () => controllerRef.current?.pause(),
    resetPlayback: () => controllerRef.current?.reset(),
    retryInitialization: () => controllerRef.current?.init(),
  };
}
