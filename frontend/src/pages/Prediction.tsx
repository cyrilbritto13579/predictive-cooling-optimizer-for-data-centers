// SPDX-License-Identifier: MIT
import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Info,
  Loader2,
  RefreshCw,
  Sliders,
  Thermometer,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { predictCombined } from '../api/predictions';
import type { CombinedPredictionResponse, SensorReading } from '../types';

export interface PredictionFormValues {
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

export const NOMINAL_DEFAULTS: PredictionFormValues = {
  chilled_water_rate: 95.0,
  cooling_water_temp: 32.0,
  building_load: 510.0,
  outside_temp: 86.0,
  dew_point: 75.0,
  humidity: 78.0,
  wind_speed: 7.0,
  pressure: 29.82,
  chiller_energy: 128.0,
};

export const TRAINING_SUPPORT_BOUNDS: Record<
  string,
  { min: number; max: number; unit: string; label: string }
> = {
  chilled_water_rate: {
    min: 72.4,
    max: 141.5,
    unit: 'L/sec',
    label: 'Chilled Water Rate',
  },
  cooling_water_temp: {
    min: 25.8,
    max: 36.2,
    unit: '°C',
    label: 'Cooling Water Temp',
  },
  building_load: {
    min: 200.0,
    max: 800.0,
    unit: 'RT',
    label: 'Building Load',
  },
  outside_temp: {
    min: 40.0,
    max: 115.0,
    unit: '°F',
    label: 'Outside Temperature',
  },
  dew_point: {
    min: 30.0,
    max: 95.0,
    unit: '°F',
    label: 'Dew Point',
  },
  pressure: {
    min: 28.0,
    max: 31.5,
    unit: 'in Hg',
    label: 'Barometric Pressure',
  },
};

export function getTrainingSupportWarning(
  field: string,
  val: number
): string | null {
  const bounds = TRAINING_SUPPORT_BOUNDS[field];
  if (!bounds || typeof val !== 'number' || isNaN(val)) return null;
  if (val < bounds.min || val > bounds.max) {
    return `Outside empirical training bounds (${bounds.min.toFixed(1)} – ${bounds.max.toFixed(1)} ${bounds.unit}). Model output is extrapolated and not physically constrained.`;
  }
  return null;
}

export const CANONICAL_BASELINE_HISTORY = Array.from({ length: 13 }, (_, i) => ({
  Energy: [115.0, 118.0, 120.0, 122.0, 121.0, 125.0, 128.0, 130.0, 127.0, 124.0, 122.0, 126.0, 125.0][i],
  'Building Load (RT)': 480.0 + i * 5,
  'Outside Temperature (F)': 80.0 + (i % 4),
  'Cooling Water Temperature (C)': 31.0 + (i % 3) * 0.5,
  'Chilled Water Rate (L/sec)': 90.0 + (i % 5),
  'Dew Point (F)': 74.0,
  'Humidity (%)': 75.0,
  'Wind Speed (mph)': 5.0,
  'Pressure (in)': 29.8,
  'Chiller Energy Consumption (kWh)': [115.0, 118.0, 120.0, 122.0, 121.0, 125.0, 128.0, 130.0, 127.0, 124.0, 122.0, 126.0, 125.0][i],
}));

export const SCENARIO_PRESETS: Record<
  string,
  { label: string; description: string; values: PredictionFormValues }
> = {
  nominal: {
    label: 'Nominal Baseline',
    description: 'Standard operating load and design-day outdoor parameters.',
    values: { ...NOMINAL_DEFAULTS },
  },
  peak_thermal: {
    label: 'Peak Thermal Load',
    description: 'High compute activity with elevated heat dissipation.',
    values: {
      chilled_water_rate: 125.0,
      cooling_water_temp: 34.5,
      building_load: 720.0,
      outside_temp: 98.0,
      dew_point: 82.0,
      humidity: 82.0,
      wind_speed: 4.0,
      pressure: 29.75,
      chiller_energy: 185.0,
    },
  },
  off_peak: {
    label: 'Off-Peak / Cool Ambient',
    description: 'Low overnight compute load with favorable ambient wet-bulb conditions.',
    values: {
      chilled_water_rate: 80.0,
      cooling_water_temp: 27.5,
      building_load: 320.0,
      outside_temp: 68.0,
      dew_point: 55.0,
      humidity: 60.0,
      wind_speed: 10.0,
      pressure: 30.05,
      chiller_energy: 88.0,
    },
  },
  humid_summer: {
    label: 'Humid Summer Peak',
    description: 'High wet-bulb ambient weather stressing cooling tower heat rejection.',
    values: {
      chilled_water_rate: 110.0,
      cooling_water_temp: 33.8,
      building_load: 610.0,
      outside_temp: 92.0,
      dew_point: 80.0,
      humidity: 90.0,
      wind_speed: 6.0,
      pressure: 29.8,
      chiller_energy: 155.0,
    },
  },
};

export const Prediction: React.FC = () => {
  const [formValues, setFormValues] = useState<PredictionFormValues>({ ...NOMINAL_DEFAULTS });
  const [activePreset, setActivePreset] = useState<string>('nominal');
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof PredictionFormValues, string>>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<CombinedPredictionResponse | null>(null);
  const [resultTimestamp, setResultTimestamp] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Field change handler
  const handleFieldChange = (field: keyof PredictionFormValues, valStr: string) => {
    setActivePreset('custom');
    const parsed = parseFloat(valStr);
    setFormValues((prev) => ({
      ...prev,
      [field]: isNaN(parsed) ? ('' as unknown as number) : parsed,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Preset selector
  const handleSelectPreset = (key: string) => {
    if (SCENARIO_PRESETS[key]) {
      setActivePreset(key);
      setFormValues({ ...SCENARIO_PRESETS[key].values });
      setValidationErrors({});
      setBackendError(null);
    }
  };

  // Client-side schema validation matching backend Pydantic contract
  const validateInputs = (): boolean => {
    const errors: Partial<Record<keyof PredictionFormValues, string>> = {};

    if (typeof formValues.chilled_water_rate !== 'number' || isNaN(formValues.chilled_water_rate)) {
      errors.chilled_water_rate = 'Required numeric value.';
    } else if (formValues.chilled_water_rate < 0 || formValues.chilled_water_rate > 500) {
      errors.chilled_water_rate = 'Must be between 0.0 and 500.0 L/sec.';
    }

    if (typeof formValues.cooling_water_temp !== 'number' || isNaN(formValues.cooling_water_temp)) {
      errors.cooling_water_temp = 'Required numeric value.';
    } else if (formValues.cooling_water_temp < 0 || formValues.cooling_water_temp > 80) {
      errors.cooling_water_temp = 'Must be between 0.0 and 80.0 °C.';
    }

    if (typeof formValues.building_load !== 'number' || isNaN(formValues.building_load)) {
      errors.building_load = 'Required numeric value.';
    } else if (formValues.building_load < 0 || formValues.building_load > 5000) {
      errors.building_load = 'Must be between 0.0 and 5000.0 RT.';
    }

    if (typeof formValues.outside_temp !== 'number' || isNaN(formValues.outside_temp)) {
      errors.outside_temp = 'Required numeric value.';
    } else if (formValues.outside_temp < -40 || formValues.outside_temp > 150) {
      errors.outside_temp = 'Must be between -40.0 and 150.0 °F.';
    }

    if (typeof formValues.dew_point !== 'number' || isNaN(formValues.dew_point)) {
      errors.dew_point = 'Required numeric value.';
    } else if (formValues.dew_point < -40 || formValues.dew_point > 150) {
      errors.dew_point = 'Must be between -40.0 and 150.0 °F.';
    }

    if (typeof formValues.humidity !== 'number' || isNaN(formValues.humidity)) {
      errors.humidity = 'Required numeric value.';
    } else if (formValues.humidity < 0 || formValues.humidity > 100) {
      errors.humidity = 'Must be between 0.0% and 100.0%.';
    }

    if (typeof formValues.wind_speed !== 'number' || isNaN(formValues.wind_speed)) {
      errors.wind_speed = 'Required numeric value.';
    } else if (formValues.wind_speed < 0 || formValues.wind_speed > 150) {
      errors.wind_speed = 'Must be between 0.0 and 150.0 mph.';
    }

    if (typeof formValues.pressure !== 'number' || isNaN(formValues.pressure)) {
      errors.pressure = 'Required numeric value.';
    } else if (formValues.pressure < 20 || formValues.pressure > 35) {
      errors.pressure = 'Must be between 20.0 and 35.0 in Hg.';
    }

    if (typeof formValues.chiller_energy !== 'number' || isNaN(formValues.chiller_energy)) {
      errors.chiller_energy = 'Required numeric value.';
    } else if (formValues.chiller_energy < 0) {
      errors.chiller_energy = 'Must be greater than or equal to 0.0 kWh.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if any active input value extrapolates beyond empirical model training bounds
  const activeExtrapolations = Object.entries(TRAINING_SUPPORT_BOUNDS)
    .filter(([key, bounds]) => {
      const val = formValues[key as keyof PredictionFormValues];
      return typeof val === 'number' && !isNaN(val) && (val < bounds.min || val > bounds.max);
    })
    .map(([key, bounds]) => {
      const val = formValues[key as keyof PredictionFormValues];
      return `${bounds.label} (${val} ${bounds.unit} vs training ${bounds.min}–${bounds.max})`;
    });

  // Form submission: execute forecast
  const handleExecuteForecast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return; // Prevent duplicate requests while in-flight

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setBackendError(null);

    const reading: SensorReading = {
      timestamp: new Date().toISOString(),
      chilled_water_rate: formValues.chilled_water_rate,
      cooling_water_temp: formValues.cooling_water_temp,
      building_load: formValues.building_load,
      outside_temp: formValues.outside_temp,
      dew_point: formValues.dew_point,
      humidity: formValues.humidity,
      wind_speed: formValues.wind_speed,
      pressure: formValues.pressure,
      chiller_energy: formValues.chiller_energy,
    };

    try {
      const response = await predictCombined({
        reading,
        history: CANONICAL_BASELINE_HISTORY,
      });

      setActiveResult(response);
      setResultTimestamp(new Date().toLocaleTimeString());
      setBackendError(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Prediction workflow encountered an unexpected backend failure.';
      setBackendError(msg);
      // Notice: activeResult is intentionally NOT erased; preserving last successful result
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to documented defaults
  const handleReset = () => {
    setFormValues({ ...NOMINAL_DEFAULTS });
    setActivePreset('nominal');
    setValidationErrors({});
    setBackendError(null);
    setActiveResult(null);
    setResultTimestamp(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. Header */}
      <SectionHeader
        title="Manual Telemetry Prediction"
        subtitle="Simulate arbitrary facility operating parameters to test forward energy demand and cooling water temperatures via sequential chained inference."
        badge={
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Sequential ML Inference
          </span>
        }
      />

      {/* 2. Main Prediction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Input Operating Parameters */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleExecuteForecast} noValidate>
            <GlassCard
              title="Operating & Environmental Parameters"
              subtitle="Raw telemetry values fed directly into the canonical 46-feature engineering pipeline."
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset to Nominal
                </Button>
              }
            >
              {/* Preset Scenario Selector */}
              <div className="mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Reference Scenario Presets
                  </span>
                  {activePreset === 'custom' && (
                    <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Custom Telemetry
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(SCENARIO_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPreset(key)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-xl text-left transition-all border ${
                        activePreset === key
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-slate-800/50 hover:border-white/10'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 1: Facility Operating Telemetry */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Facility Operating Telemetry
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Chilled Water Rate */}
                  <div>
                    <label
                      htmlFor="field-chilled-water-rate"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Chilled Water Flow Rate (L/sec)
                    </label>
                    <div className="relative">
                      <input
                        id="field-chilled-water-rate"
                        type="number"
                        value={formValues.chilled_water_rate}
                        onChange={(e) => handleFieldChange('chilled_water_rate', e.target.value)}
                        step="0.5"
                        min="0"
                        max="500"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.chilled_water_rate
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">L/sec</span>
                    </div>
                    {validationErrors.chilled_water_rate ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.chilled_water_rate}
                      </span>
                    ) : getTrainingSupportWarning('chilled_water_rate', formValues.chilled_water_rate) ? (
                      <span className="text-[11px] text-amber-300/95 mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getTrainingSupportWarning('chilled_water_rate', formValues.chilled_water_rate)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Training support: 72.40 – 141.50 L/s (Nominal: 95.0)
                      </span>
                    )}
                  </div>

                  {/* Field 2: Cooling Water Temp */}
                  <div>
                    <label
                      htmlFor="field-cooling-water-temp"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Cooling Water Temperature (°C)
                    </label>
                    <div className="relative">
                      <input
                        id="field-cooling-water-temp"
                        type="number"
                        value={formValues.cooling_water_temp}
                        onChange={(e) => handleFieldChange('cooling_water_temp', e.target.value)}
                        step="0.1"
                        min="0"
                        max="80"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.cooling_water_temp
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">°C</span>
                    </div>
                    {validationErrors.cooling_water_temp ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.cooling_water_temp}
                      </span>
                    ) : getTrainingSupportWarning('cooling_water_temp', formValues.cooling_water_temp) ? (
                      <span className="text-[11px] text-amber-300/95 mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getTrainingSupportWarning('cooling_water_temp', formValues.cooling_water_temp)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Condenser loop water (Observed: 25.80 – 36.20 °C)
                      </span>
                    )}
                  </div>

                  {/* Field 3: Building Load (RT) */}
                  <div>
                    <label
                      htmlFor="field-building-load"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Building Thermal Load (RT)
                    </label>
                    <div className="relative">
                      <input
                        id="field-building-load"
                        type="number"
                        value={formValues.building_load}
                        onChange={(e) => handleFieldChange('building_load', e.target.value)}
                        step="5"
                        min="0"
                        max="5000"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.building_load
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">RT</span>
                    </div>
                    {validationErrors.building_load ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.building_load}
                      </span>
                    ) : getTrainingSupportWarning('building_load', formValues.building_load) ? (
                      <span className="text-[11px] text-amber-300/95 mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getTrainingSupportWarning('building_load', formValues.building_load)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Server heat load in Refrigeration Tons (~200 – 800 RT)
                      </span>
                    )}
                  </div>

                  {/* Field 4: Chiller Energy */}
                  <div>
                    <label
                      htmlFor="field-chiller-energy"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Recent Chiller Energy (kWh)
                    </label>
                    <div className="relative">
                      <input
                        id="field-chiller-energy"
                        type="number"
                        value={formValues.chiller_energy}
                        onChange={(e) => handleFieldChange('chiller_energy', e.target.value)}
                        step="1"
                        min="0"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.chiller_energy
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">kWh</span>
                    </div>
                    {validationErrors.chiller_energy ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.chiller_energy}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Preceding baseline electric power consumption
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 2: Ambient Meteorological Telemetry */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Ambient Meteorological Telemetry
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Field 5: Outside Temp */}
                  <div>
                    <label
                      htmlFor="field-outside-temp"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Outside Dry-Bulb Temp (°F)
                    </label>
                    <div className="relative">
                      <input
                        id="field-outside-temp"
                        type="number"
                        value={formValues.outside_temp}
                        onChange={(e) => handleFieldChange('outside_temp', e.target.value)}
                        step="0.5"
                        min="-40"
                        max="150"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.outside_temp
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">°F</span>
                    </div>
                    {validationErrors.outside_temp ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.outside_temp}
                      </span>
                    ) : getTrainingSupportWarning('outside_temp', formValues.outside_temp) ? (
                      <span className="text-[11px] text-amber-300/95 mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getTrainingSupportWarning('outside_temp', formValues.outside_temp)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Ambient weather (40.0 – 115.0 °F)
                      </span>
                    )}
                  </div>

                  {/* Field 6: Dew Point */}
                  <div>
                    <label
                      htmlFor="field-dew-point"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Dew Point (°F)
                    </label>
                    <div className="relative">
                      <input
                        id="field-dew-point"
                        type="number"
                        value={formValues.dew_point}
                        onChange={(e) => handleFieldChange('dew_point', e.target.value)}
                        step="0.5"
                        min="-40"
                        max="150"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.dew_point
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">°F</span>
                    </div>
                    {validationErrors.dew_point ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.dew_point}
                      </span>
                    ) : getTrainingSupportWarning('dew_point', formValues.dew_point) ? (
                      <span className="text-[11px] text-amber-300/95 mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getTrainingSupportWarning('dew_point', formValues.dew_point)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Cooling tower moisture index (30.0 – 95.0 °F)
                      </span>
                    )}
                  </div>

                  {/* Field 7: Humidity */}
                  <div>
                    <label
                      htmlFor="field-humidity"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Relative Humidity (%)
                    </label>
                    <div className="relative">
                      <input
                        id="field-humidity"
                        type="number"
                        value={formValues.humidity}
                        onChange={(e) => handleFieldChange('humidity', e.target.value)}
                        step="1"
                        min="0"
                        max="100"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.humidity
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                    </div>
                    {validationErrors.humidity ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.humidity}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Ambient humidity (10 – 100%)
                      </span>
                    )}
                  </div>

                  {/* Field 8: Wind Speed */}
                  <div>
                    <label
                      htmlFor="field-wind-speed"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Wind Speed (mph)
                    </label>
                    <div className="relative">
                      <input
                        id="field-wind-speed"
                        type="number"
                        value={formValues.wind_speed}
                        onChange={(e) => handleFieldChange('wind_speed', e.target.value)}
                        step="0.5"
                        min="0"
                        max="150"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.wind_speed
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">mph</span>
                    </div>
                    {validationErrors.wind_speed ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.wind_speed}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Atmospheric air velocity
                      </span>
                    )}
                  </div>

                  {/* Field 9: Pressure */}
                  <div>
                    <label
                      htmlFor="field-pressure"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Barometric Pressure (in Hg)
                    </label>
                    <div className="relative">
                      <input
                        id="field-pressure"
                        type="number"
                        value={formValues.pressure}
                        onChange={(e) => handleFieldChange('pressure', e.target.value)}
                        step="0.01"
                        min="20"
                        max="35"
                        disabled={isLoading}
                        className={`w-full bg-slate-950/60 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none number-mono ${
                          validationErrors.pressure
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">in Hg</span>
                    </div>
                    {validationErrors.pressure ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">
                        {validationErrors.pressure}
                      </span>
                    ) : getTrainingSupportWarning('pressure', formValues.pressure) ? (
                      <span className="text-[11px] text-amber-300/95 mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getTrainingSupportWarning('pressure', formValues.pressure)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Atmospheric pressure (28.0 – 31.5 in)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Global Extrapolation Warning Banner */}
              {activeExtrapolations.length > 0 && (
                <div className="mt-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-amber-300">
                      Empirical Training Support Notice ({activeExtrapolations.length} parameter{activeExtrapolations.length > 1 ? 's' : ''} out-of-bounds)
                    </div>
                    <p className="text-[11px] text-slate-300">
                      The selected telemetry values exceed the empirical support observed during model training. The XGBoost model will extrapolate mathematically; predictions represent model calculations without physical safety guarantees.
                    </p>
                    <div className="text-[11px] text-amber-400/90 font-mono">
                      {activeExtrapolations.join(' • ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Action Bar */}
              <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Canonical core derives 46 interaction, lag, and cyclic features on the backend.
                  </span>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={
                    isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                  disabled={isLoading}
                >
                  {isLoading ? 'Executing Forecast...' : 'Execute Forecast'}
                </Button>
              </div>
            </GlassCard>
          </form>

          {/* Backend Error Notification (with failure state preservation) */}
          {backendError && (
            <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-xs text-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-300">Prediction Request Error</div>
                <div>{backendError}</div>
                {activeResult && (
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-500/20">
                    Note: Retaining previously calculated forecast results below from{' '}
                    <span className="text-slate-200 font-mono">{resultTimestamp}</span>.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Status Notice */}
          {activeResult && !backendError && (
            <div className="glass-panel-subtle p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Forecast successfully evaluated at{' '}
                  <span className="font-mono text-emerald-300">{resultTimestamp}</span> via{' '}
                  <code className="text-cyan-300 bg-cyan-950/50 px-1 py-0.5 rounded font-mono">
                    POST /api/predict/combined
                  </code>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Pipeline: {String(activeResult.metadata?.pipeline ?? 'canonical_chained_v1')}
              </span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Forecast Output Cards */}
        <div className="flex flex-col gap-6">
          {/* Energy Output Card */}
          <GlassCard
            variant="accent"
            title="Chiller Power Demand"
            subtitle="Predicted instantaneous power consumption"
            badge={
              <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                Primary Model
              </span>
            }
          >
            <div className="py-4 text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-white number-mono">
                  {activeResult ? activeResult.predicted_energy_kwh.toFixed(2) : '--.--'}
                </span>
                <span className="text-sm font-semibold text-cyan-400">
                  {activeResult?.energy_units ?? 'kWh'}
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-2 block">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-1.5 text-cyan-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> In-flight inference...
                  </span>
                ) : activeResult ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Evaluated via XGBRegressor
                  </span>
                ) : (
                  'Awaiting parameter submission'
                )}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Model Architecture:</span>
                <span className="font-mono text-slate-200">XGBoost Regressor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Validated R²:</span>
                <span className="font-mono text-emerald-400">0.9891</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Historical MAE:</span>
                <span className="font-mono text-slate-200">1.222 kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Variable:</span>
                <span className="font-mono text-slate-300 text-[11px]">Energy (kWh)</span>
              </div>
            </div>
          </GlassCard>

          {/* Temperature Output Card */}
          <GlassCard
            title="Cooling Water Temperature"
            subtitle="1-hour forward condenser thermal projection"
            badge={
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                Chained Model
              </span>
            }
          >
            <div className="py-4 text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-white number-mono">
                  {activeResult ? activeResult.predicted_temp_c.toFixed(2) : '--.--'}
                </span>
                <span className="text-sm font-semibold text-indigo-400">
                  {activeResult?.temperature_units ?? '°C'}
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-2 block">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-1.5 text-indigo-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> In-flight inference...
                  </span>
                ) : activeResult ? (
                  <span className="text-indigo-300 flex items-center justify-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" /> Chained from predicted energy
                  </span>
                ) : (
                  'Evaluated after energy inference'
                )}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Chained Dependency:</span>
                <span className="font-mono text-cyan-300">Energy (kWh)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Validated R²:</span>
                <span className="font-mono text-indigo-300">0.6853</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Benchmark Tolerance:</span>
                <span className="font-mono text-emerald-400">±1°C (89.2%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prediction Horizon:</span>
                <span className="font-mono text-slate-200">+60 Minutes</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
