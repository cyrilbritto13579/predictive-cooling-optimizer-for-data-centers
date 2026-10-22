// SPDX-License-Identifier: MIT
import { apiClient } from './client';
import type { SimulationStepRequest, SimulationStepResponse } from '../types';

/**
 * Advance the deterministic HVAC simulation by one step.
 */
export async function simulationStep(
  request: SimulationStepRequest
): Promise<SimulationStepResponse> {
  return apiClient<SimulationStepResponse>('/api/simulation/step', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
