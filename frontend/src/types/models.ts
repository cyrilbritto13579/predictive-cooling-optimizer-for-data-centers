// SPDX-License-Identifier: MIT
/**
 * ML Model, Prediction, Optimization, and Simulation schemas mirroring FastAPI contracts.
 */

export interface ModelHyperparameters {
  n_estimators?: number;
  learning_rate?: number;
  max_depth?: number;
  [key: string]: unknown;
}

export interface ModelInfo {
  name: string;
  model_type: string;
  target_variable: string;
  feature_count: number;
  features: string[];
  hyperparameters: ModelHyperparameters;
}

export interface ModelsInfoResponse {
  energy_model: ModelInfo;
  temperature_model: ModelInfo;
}

export interface SensorReading {
  timestamp?: string;
  chilled_water_rate: number;
  cooling_water_temp: number;
  building_load: number;
  outside_temp: number;
  dew_point: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  chiller_energy: number;
}

export interface HistoricalDataPoint extends SensorReading {}

export interface EnergyPredictionRequest {
  reading?: SensorReading;
  history?: HistoricalDataPoint[];
  pre_engineered_row?: Record<string, number>;
}

export interface EnergyPredictionResponse {
  predicted_energy_kwh: number;
  units: string;
  timestamp: string | null;
  metadata: Record<string, unknown>;
}

export interface TemperaturePredictionRequest {
  reading?: SensorReading;
  history?: HistoricalDataPoint[];
  pre_engineered_row?: Record<string, number>;
  predicted_energy_kwh?: number;
}

export interface TemperaturePredictionResponse {
  predicted_temp_c: number;
  units: string;
  chained_energy_kwh: number;
  timestamp: string | null;
  metadata: Record<string, unknown>;
}

export interface CombinedPredictionRequest {
  reading?: SensorReading;
  history?: HistoricalDataPoint[];
  pre_engineered_row?: Record<string, number>;
}

export interface CombinedPredictionResponse {
  predicted_energy_kwh: number;
  predicted_temp_c: number;
  energy_units: string;
  temperature_units: string;
  timestamp: string | null;
  metadata: Record<string, unknown>;
}

export interface CandidatePoint {
  chilled_water_rate_adjustment: number;
  chilled_water_rate: number;
  predicted_energy_kwh: number;
  predicted_temp_c: number | null;
  energy_delta_kwh: number;
  is_selected: boolean;
  satisfies_temp_constraint?: boolean | null;
}

export interface OptimizationRequest {
  reading?: SensorReading;
  history?: HistoricalDataPoint[];
  pre_engineered_row?: Record<string, number>;
  adjustments?: number[];
  temperature_constraint_max?: number | null;
  include_temp?: boolean;
}

export interface OptimizationResponse {
  baseline_energy_kwh: number;
  optimized_energy_kwh: number;
  estimated_energy_reduction_kwh: number;
  savings_percent: number;
  current_chilled_water_rate: number;
  selected_chilled_water_rate: number;
  selected_adjustment: number;
  baseline_temp_c: number | null;
  suggestion: string;
  candidates: CandidatePoint[];
  evaluation_status: 'unconstrained' | 'constrained_optimal' | 'no_feasible_candidate';
  temperature_constraint_max: number | null;
  feasible_candidate_found: boolean;
  units: {
    energy: string;
    flow_rate: string;
    temperature: string;
    [key: string]: string;
  };
  disclaimer: string;
}

export interface SimulationStepRequest {
  current_index: number;
  include_optimization?: boolean;
}

export interface SimulationFrame {
  step_index: number;
  predicted_energy_kwh: number;
  lagged_energy_kwh: number;
  predicted_temp_c: number;
  lagged_outside_temp_f: number;
  potential_savings_pct: number;
  current_chilled_water_rate: number;
  timestamp: string | null;
}

export interface SimulationState {
  current_index: number;
  is_running: boolean;
  total_steps: number;
}

export interface SimulationStepResponse {
  next_state: SimulationState;
  frame: SimulationFrame;
  optimization: OptimizationResponse | null;
}
