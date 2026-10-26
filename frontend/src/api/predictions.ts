// SPDX-License-Identifier: MIT
import { apiClient } from './client';
import type {
  CombinedPredictionRequest,
  CombinedPredictionResponse,
  EnergyPredictionRequest,
  EnergyPredictionResponse,
  TemperaturePredictionRequest,
  TemperaturePredictionResponse,
} from '../types';

/**
 * Predict chiller energy consumption (kWh).
 */
export async function predictEnergy(
  request: EnergyPredictionRequest
): Promise<EnergyPredictionResponse> {
  return apiClient<EnergyPredictionResponse>('/api/predict/energy', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Predict cooling water temperature (°C) 1 hour ahead.
 */
export async function predictTemperature(
  request: TemperaturePredictionRequest
): Promise<TemperaturePredictionResponse> {
  return apiClient<TemperaturePredictionResponse>('/api/predict/temperature', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Predict both energy and temperature via chained pipeline.
 */
export async function predictCombined(
  request: CombinedPredictionRequest
): Promise<CombinedPredictionResponse> {
  return apiClient<CombinedPredictionResponse>('/api/predict/combined', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
