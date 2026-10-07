// SPDX-License-Identifier: MIT
/**
 * Common API error and health schemas.
 */

export interface ErrorResponse {
  detail: string;
  error_type: string;
  status_code: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'offline';
  version: string;
  core_available: boolean;
  models_loaded: boolean;
  models: {
    energy_model: boolean;
    temperature_model: boolean;
  };
}

export interface SampleDataResponse {
  total_rows: number;
  offset: number;
  limit: number;
  columns: string[];
  rows: Record<string, number | string | null>[];
}
