// SPDX-License-Identifier: MIT
import { apiClient } from './client';
import type { ModelsInfoResponse } from '../types';

/**
 * Fetch ML models metadata, feature names, and hyperparameters.
 */
export async function getModelInfo(): Promise<ModelsInfoResponse> {
  return apiClient<ModelsInfoResponse>('/api/models/info');
}
