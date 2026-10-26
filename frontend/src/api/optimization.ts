// SPDX-License-Identifier: MIT
import { apiClient } from './client';
import type { OptimizationRequest, OptimizationResponse } from '../types';

/**
 * Execute cooling setpoint optimization across candidate adjustments.
 */
export async function optimizeCooling(
  request: OptimizationRequest
): Promise<OptimizationResponse> {
  return apiClient<OptimizationResponse>('/api/optimize', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
