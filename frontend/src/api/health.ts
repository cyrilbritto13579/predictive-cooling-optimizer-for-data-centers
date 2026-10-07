// SPDX-License-Identifier: MIT
import { apiClient } from './client';
import type { HealthResponse } from '../types';

/**
 * Check backend health status and loaded ML models.
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/api/health');
}
