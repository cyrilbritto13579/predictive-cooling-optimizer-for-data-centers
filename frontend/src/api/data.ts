// SPDX-License-Identifier: MIT
import { apiClient } from './client';
import type { SampleDataResponse } from '../types';

/**
 * Fetch paginated sample telemetry data records.
 */
export async function getSampleData(
  offset: number = 0,
  limit: number = 50
): Promise<SampleDataResponse> {
  return apiClient<SampleDataResponse>(`/api/data/sample?offset=${offset}&limit=${limit}`);
}
