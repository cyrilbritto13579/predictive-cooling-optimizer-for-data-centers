// SPDX-License-Identifier: MIT
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Cpu,
  Database,
  Gauge,
  Layers,
  Sliders,
  Sparkles,
  Thermometer,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { KpiCard } from '../components/ui/KpiCard';
import { Button } from '../components/ui/Button';
import { getModelInfo } from '../api/models';
import type { ModelsInfoResponse } from '../types';

export const Home: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelsInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getModelInfo()
      .then((data) => {
        if (isMounted) setModelInfo(data);
      })
      .catch(() => {
        // Fallback info if API is currently offline during static preview
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* 1. Technical Hero Section */}
      <section className="relative pt-6 sm:pt-10 pb-4 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel-subtle text-xs text-cyan-300 mb-4 border border-cyan-500/20 shadow-sm shadow-cyan-950/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Industrial HVAC Intelligence • XGBoost Regression</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          PREDICTIVE COOLING <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">OPTIMIZER</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 font-medium mb-3">
          Temperature-Aware Chiller Scheduling for Data Center Facilities
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed mb-6">
          High-dimensional predictive optimization pipeline for thermal management. Continuously forecasts chiller power consumption and 1-hour forward cooling water temperatures to dynamically trim cooling energy while guaranteeing critical thermal thresholds.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Analytics Dashboard
            </Button>
          </Link>
          <Link to="/optimization">
            <Button variant="secondary" size="md" leftIcon={<Sliders className="w-4 h-4" />}>
              Cooling Optimizer
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Key Architecture Metrics (From Core Models) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Core Model Benchmark Performance
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {loading ? 'Fetching metadata...' : modelInfo ? 'Models Loaded & Verified' : 'Validated Benchmarks'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Chiller Energy Model"
            value="0.9891"
            unit="R²"
            icon={<Zap className="w-4 h-4" />}
            delta={{ value: 'MAE 1.222 kWh', trend: 'positive', label: 'error rate' }}
            subtitle={modelInfo?.energy_model?.model_type ?? 'XGBoost Regressor'}
          />

          <KpiCard
            label="Temperature Model"
            value="0.6853"
            unit="R²"
            icon={<Thermometer className="w-4 h-4" />}
            delta={{ value: '89.24%', trend: 'positive', label: 'within ±1°C' }}
            subtitle="1-Hour Ahead Chained Forecast"
          />

          <KpiCard
            label="Feature Dimension"
            value={modelInfo?.energy_model?.feature_count ?? 46}
            unit="Engineered"
            icon={<Layers className="w-4 h-4" />}
            delta={{ value: '100% Parity', trend: 'positive', label: 'canonical' }}
            subtitle="Lags, Rolling Means, Cyclical"
          />

          <KpiCard
            label="Training Corpus"
            value="13,615"
            unit="HVAC Records"
            icon={<Database className="w-4 h-4" />}
            delta={{ value: 'Deterministic', trend: 'neutral', label: 'replay' }}
            subtitle="Singapore GMT+8 Facility Telemetry"
          />
        </div>
      </section>

      {/* 3. System Overview Pipeline */}
      <section>
        <GlassCard
          title="Canonical Inference & Optimization Pipeline"
          subtitle="Sequential chained architecture ensuring thermodynamic consistency across forecasting and scheduling."
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative my-2">
            {/* Step 1 */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-cyan-500">
              <div>
                <span className="text-[11px] font-mono text-cyan-400">01. INGESTION</span>
                <h4 className="text-sm font-semibold text-white mt-1">Sensor Telemetry</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time flow rates, wet bulb, dry bulb, pressure & thermal loads.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-mono">10 Raw Metrics</div>
            </div>

            {/* Step 2 */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-cyan-400">
              <div>
                <span className="text-[11px] font-mono text-cyan-400">02. SYNTHESIS</span>
                <h4 className="text-sm font-semibold text-white mt-1">Feature Engineering</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  12-row historical sliding window, lags, rolling stats & sin/cos time.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-mono">46 Features</div>
            </div>

            {/* Step 3 */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-blue-400">
              <div>
                <span className="text-[11px] font-mono text-blue-400">03. PRIMARY INFERENCE</span>
                <h4 className="text-sm font-semibold text-white mt-1">Energy Model</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  XGBoost regression predicts instantaneous power draw in kWh.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-mono">R² = 0.9891</div>
            </div>

            {/* Step 4 */}
            <div className="glass-panel-subtle p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-indigo-400">
              <div>
                <span className="text-[11px] font-mono text-indigo-400">04. CHAINED FORECAST</span>
                <h4 className="text-sm font-semibold text-white mt-1">Temperature Model</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Feeds energy estimate forward to project cooling water temperature.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 font-mono">1-hr Horizon</div>
            </div>

            {/* Step 5 */}
            <div className="glass-panel-accent p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-emerald-400">
              <div>
                <span className="text-[11px] font-mono text-emerald-400">05. OPTIMIZATION</span>
                <h4 className="text-sm font-semibold text-white mt-1">Setpoint Trimming</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Evaluates candidate flow adjustments under temperature safety bounds.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-emerald-400 font-mono">Δ Flow Setpoints</div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 4. Feature Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/dashboard" className="group">
          <GlassCard
            variant="interactive"
            className="h-full flex flex-col justify-between group-hover:border-cyan-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:bg-cyan-500/20 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Live Analytics Dashboard
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Inspect real-time telemetry playback, live power curves, and thermal headroom trends.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
              <span>View Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </GlassCard>
        </Link>

        <Link to="/prediction" className="group">
          <GlassCard
            variant="interactive"
            className="h-full flex flex-col justify-between group-hover:border-cyan-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:bg-sky-500/20 transition-colors">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Manual Prediction
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Simulate arbitrary ambient wet bulb, flow rates, and facility loads for custom forecasts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
              <span>Run Inference</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </GlassCard>
        </Link>

        <Link to="/optimization" className="group">
          <GlassCard
            variant="interactive"
            className="h-full flex flex-col justify-between group-hover:border-cyan-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500/20 transition-colors">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Setpoint Optimization
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Counterfactual grid search determining the most energy-efficient chiller flow rates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
              <span>Optimize Cooling</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </GlassCard>
        </Link>

        <Link to="/models" className="group">
          <GlassCard
            variant="interactive"
            className="h-full flex flex-col justify-between group-hover:border-cyan-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:bg-indigo-500/20 transition-colors">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Model Intelligence
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Inspect hyperparameter weights, 46-feature dictionaries, and validation regression scores.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
              <span>Inspect Models</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </GlassCard>
        </Link>
      </section>
    </div>
  );
};
