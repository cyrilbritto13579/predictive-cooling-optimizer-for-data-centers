// SPDX-License-Identifier: MIT
import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { getModelInfo } from '../api/models';
import type { ModelsInfoResponse } from '../types';

export const Models: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelsInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    getModelInfo()
      .then((data) => {
        if (isMounted) setModelInfo(data);
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const energyFeatures = modelInfo?.energy_model?.features ?? [];
  const filteredFeatures = energyFeatures.filter((f) =>
    f.toLowerCase().includes(featureSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. Header */}
      <SectionHeader
        title="Model Intelligence & Specifications"
        subtitle="Sanitized architectural parameters, feature schemas, and validation benchmarks from canonical XGBoost artifacts."
        badge={
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {loading ? 'Loading...' : modelInfo ? 'Live Metadata Verified' : 'Validated Schema'}
          </span>
        }
      />

      {/* 2. Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model 1: Energy Model */}
        <GlassCard
          variant="accent"
          title="Chiller Energy Prediction Model"
          subtitle="Estimates instantaneous chiller electrical consumption (kWh)"
          badge={
            <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
              Primary Regressor
            </span>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="glass-panel-subtle p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Model Type</span>
                <span className="text-sm font-semibold text-white number-mono">
                  {modelInfo?.energy_model?.model_type ?? 'XGBRegressor'}
                </span>
              </div>
              <div className="glass-panel-subtle p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block">R² Benchmark</span>
                <span className="text-sm font-semibold text-emerald-400 number-mono">
                  0.9891
                </span>
              </div>
              <div className="glass-panel-subtle p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Mean Abs Error</span>
                <span className="text-sm font-semibold text-white number-mono">
                  1.222 kWh
                </span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Hyperparameter Configuration
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="glass-panel-subtle p-2 rounded-lg flex flex-col">
                  <span className="text-[10px] text-slate-400">n_estimators</span>
                  <span className="text-cyan-300 font-semibold">
                    {modelInfo?.energy_model?.hyperparameters?.n_estimators ?? 300}
                  </span>
                </div>
                <div className="glass-panel-subtle p-2 rounded-lg flex flex-col">
                  <span className="text-[10px] text-slate-400">learning_rate</span>
                  <span className="text-cyan-300 font-semibold">
                    {modelInfo?.energy_model?.hyperparameters?.learning_rate ?? 0.05}
                  </span>
                </div>
                <div className="glass-panel-subtle p-2 rounded-lg flex flex-col">
                  <span className="text-[10px] text-slate-400">max_depth</span>
                  <span className="text-cyan-300 font-semibold">
                    {modelInfo?.energy_model?.hyperparameters?.max_depth ?? 6}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Target: Chiller Energy Consumption (kWh)</span>
              <span className="font-mono text-cyan-400">46 Input Features</span>
            </div>
          </div>
        </GlassCard>

        {/* Model 2: Temperature Model */}
        <GlassCard
          title="Cooling Water Temperature Model"
          subtitle="Forecasts condenser water temperature (°C) 1 hour into the future"
          badge={
            <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
              Chained Regressor
            </span>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="glass-panel-subtle p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Model Type</span>
                <span className="text-sm font-semibold text-white number-mono">
                  {modelInfo?.temperature_model?.model_type ?? 'XGBRegressor'}
                </span>
              </div>
              <div className="glass-panel-subtle p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block">R² Benchmark</span>
                <span className="text-sm font-semibold text-indigo-400 number-mono">
                  0.6853
                </span>
              </div>
              <div className="glass-panel-subtle p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block">±1°C Tolerance</span>
                <span className="text-sm font-semibold text-emerald-400 number-mono">
                  89.24%
                </span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Hyperparameter Configuration
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="glass-panel-subtle p-2 rounded-lg flex flex-col">
                  <span className="text-[10px] text-slate-400">n_estimators</span>
                  <span className="text-indigo-300 font-semibold">
                    {modelInfo?.temperature_model?.hyperparameters?.n_estimators ?? 250}
                  </span>
                </div>
                <div className="glass-panel-subtle p-2 rounded-lg flex flex-col">
                  <span className="text-[10px] text-slate-400">learning_rate</span>
                  <span className="text-indigo-300 font-semibold">
                    {modelInfo?.temperature_model?.hyperparameters?.learning_rate ?? 0.05}
                  </span>
                </div>
                <div className="glass-panel-subtle p-2 rounded-lg flex flex-col">
                  <span className="text-[10px] text-slate-400">max_depth</span>
                  <span className="text-indigo-300 font-semibold">
                    {modelInfo?.temperature_model?.hyperparameters?.max_depth ?? 5}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Target: Cooling Water Temperature (C)</span>
              <span className="font-mono text-indigo-400">Chained Sequential Pipeline</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Feature Engineering Breakdown */}
      <GlassCard
        title="Canonical 46-Feature Engineering Schema"
        subtitle="Mathematical parity guaranteed across training fixtures and live API requests."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
            46 Features
          </span>
        }
        action={
          <button
            onClick={() => setFeaturesExpanded(!featuresExpanded)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
          >
            <span>{featuresExpanded ? 'Collapse Schema' : 'Inspect Features'}</span>
            {featuresExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-panel-subtle p-3 rounded-xl">
              <span className="text-xs font-semibold text-slate-200">1. Instantaneous Telemetry</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Flow rates, cooling temperatures, ambient wet/dry bulb, dew points, and facility load.
              </p>
            </div>
            <div className="glass-panel-subtle p-3 rounded-xl">
              <span className="text-xs font-semibold text-slate-200">2. Sliding Window Lags</span>
              <p className="text-[11px] text-slate-400 mt-1">
                1-step, 2-step, and multi-hour backward lag vectors capture thermal inertia.
              </p>
            </div>
            <div className="glass-panel-subtle p-3 rounded-xl">
              <span className="text-xs font-semibold text-slate-200">3. Rolling Statistics</span>
              <p className="text-[11px] text-slate-400 mt-1">
                12-row rolling means and volatility filters smooth out transient measurement spikes.
              </p>
            </div>
            <div className="glass-panel-subtle p-3 rounded-xl">
              <span className="text-xs font-semibold text-slate-200">4. Cyclical Encodings</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Sin/cos periodic representations of diurnal hours and days of the week.
              </p>
            </div>
          </div>

          {featuresExpanded && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search 46 features..."
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {(filteredFeatures.length > 0 ? filteredFeatures : energyFeatures).map(
                  (feature, idx) => (
                    <div
                      key={feature}
                      className="glass-panel-subtle p-2 rounded-lg text-[11px] font-mono text-slate-300 flex items-center justify-between"
                    >
                      <span className="truncate">{feature}</span>
                      <span className="text-[10px] text-slate-400 ml-2">#{idx + 1}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
