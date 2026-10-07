// SPDX-License-Identifier: MIT
import React from 'react';
import {
  Activity,
  Calendar,
  FastForward,
  Play,
  RotateCcw,
  Sliders,
  Thermometer,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { KpiCard } from '../components/ui/KpiCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. Header & Controls Ribbon */}
      <SectionHeader
        title="Live Telemetry Analytics"
        subtitle="Real-time HVAC sensor ingestion, continuous forward power forecasting, and thermal constraint monitoring."
        badge={
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Phase 5 Visual Skeleton
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              24-Hour Window
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              disabled
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              disabled
            >
              Start Playback
            </Button>
          </div>
        }
      />

      {/* 2. Simulation State & Playback Banner (Placeholder) */}
      <div className="glass-panel-subtle rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            Deterministic Simulation Mode:
          </span>
          <span className="number-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            Step 0 / 13,615
          </span>
          <span className="text-slate-400 hidden md:inline">
            Timestamp: 2018-01-01 00:00:00 (GMT+8)
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px]">Simulation engine connector scheduled for</span>
          <span className="text-cyan-300 font-medium">Phase 6</span>
          <FastForward className="w-3.5 h-3.5 text-cyan-400 ml-1" />
        </div>
      </div>

      {/* 3. Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Chiller Power Consumption"
          value="128.83"
          unit="kWh"
          icon={<Zap className="w-4 h-4" />}
          delta={{ value: "-2.4%", trend: "positive", label: "vs 1hr lag" }}
          subtitle="Model Prediction Baseline"
          variant="accent"
        />

        <KpiCard
          label="Cooling Water Temperature"
          value="32.15"
          unit="°C"
          icon={<Thermometer className="w-4 h-4" />}
          delta={{ value: "Safe Range", trend: "positive", label: "max 34.0°C" }}
          subtitle="1-Hour Ahead Projected"
        />

        <KpiCard
          label="Potential Energy Trimming"
          value="—"
          unit="%"
          icon={<TrendingDown className="w-4 h-4" />}
          delta={{ value: "Awaiting Step", trend: "neutral", label: "optimizer" }}
          subtitle="Counterfactual Difference"
        />

        <KpiCard
          label="Chilled Water Flow Rate"
          value="10.50"
          unit="L/sec"
          icon={<Sliders className="w-4 h-4" />}
          delta={{ value: "Set: 10.5 L/s", trend: "neutral", label: "nominal" }}
          subtitle="Range [5.0 - 20.0 L/s]"
        />
      </div>

      {/* 4. Chart Areas Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Energy Consumption Chart Area */}
        <GlassCard
          title="Chiller Energy Consumption Forecast"
          subtitle="Predicted instantaneous power (kWh) vs historical lagged readings"
          badge={
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
              XGBoost R² 0.9891
            </span>
          }
          action={
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> Forecast
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                <span className="w-2.5 h-0.5 bg-slate-500 rounded-full" /> Lagged Baseline
              </span>
            </div>
          }
        >
          <div className="h-64 sm:h-72 w-full rounded-xl bg-slate-950/40 border border-white/5 relative flex flex-col justify-between p-4 overflow-hidden">
            {/* Visual Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
              <div className="border-b border-white/20 w-full h-0" />
              <div className="border-b border-white/20 w-full h-0" />
              <div className="border-b border-white/20 w-full h-0" />
              <div className="border-b border-white/20 w-full h-0" />
            </div>

            {/* Stylized SVG Chart Placeholder Curve */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 500 150"
                className="w-full h-36 stroke-cyan-400 fill-cyan-500/10 opacity-70"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,110 Q70,60 140,80 T280,45 T420,70 T500,40 L500,150 L0,150 Z"
                  fill="url(#energyGrad)"
                />
                <path
                  d="M0,110 Q70,60 140,80 T280,45 T420,70 T500,40"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                {/* Secondary baseline dashed curve */}
                <path
                  d="M0,120 Q70,75 140,90 T280,60 T420,85 T500,55"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[2px]">
                <div className="w-10 h-10 rounded-full bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 shadow-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  Real-Time Energy Stream Placeholder
                </span>
                <span className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Chart rendering will bind to deterministic simulation playback in Phase 6.
                </span>
              </div>
            </div>

            {/* Time labels axis */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-white/5">
              <span>T - 60 min</span>
              <span>T - 45 min</span>
              <span>T - 30 min</span>
              <span>T - 15 min</span>
              <span className="text-cyan-400">Current (T)</span>
            </div>
          </div>
        </GlassCard>

        {/* Chart 2: Cooling Water Temperature Forecast */}
        <GlassCard
          title="Cooling Water Temperature Forecast"
          subtitle="Chained thermal trajectory (°C) with safety boundary monitoring"
          badge={
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
              Tolerance ±1°C: 89.2%
            </span>
          }
          action={
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-0.5 bg-indigo-400 rounded-full" /> 1-hr Forecast
              </span>
              <span className="flex items-center gap-1.5 text-rose-400/80 ml-2">
                <span className="w-2.5 h-0.5 bg-rose-500/80 rounded-full" /> Safe Upper Limit (34°C)
              </span>
            </div>
          }
        >
          <div className="h-64 sm:h-72 w-full rounded-xl bg-slate-950/40 border border-white/5 relative flex flex-col justify-between p-4 overflow-hidden">
            {/* Visual Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
              <div className="border-b border-rose-500/40 w-full h-0" />
              <div className="border-b border-white/20 w-full h-0" />
              <div className="border-b border-white/20 w-full h-0" />
              <div className="border-b border-white/20 w-full h-0" />
            </div>

            {/* Stylized SVG Chart Placeholder Curve */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 500 150"
                className="w-full h-36 stroke-indigo-400 fill-indigo-500/10 opacity-70"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 Q90,110 180,85 T360,70 T500,80 L500,150 L0,150 Z"
                  fill="url(#tempGrad)"
                />
                <path
                  d="M0,90 Q90,110 180,85 T360,70 T500,80"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />
                {/* Max constraint line */}
                <line
                  x1="0"
                  y1="25"
                  x2="500"
                  y2="25"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[2px]">
                <div className="w-10 h-10 rounded-full bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2 shadow-lg">
                  <Thermometer className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  Temperature Forecast Curve Placeholder
                </span>
                <span className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Chained forward predictions will update continuously in Phase 6.
                </span>
              </div>
            </div>

            {/* Time labels axis */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-white/5">
              <span>Current (T)</span>
              <span>+ 15 min</span>
              <span>+ 30 min</span>
              <span>+ 45 min</span>
              <span className="text-indigo-400">+ 60 min Ahead</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 5. Facility Subsystem Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="subtle" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Thermal Safety Margin
            </span>
            <span className="text-xs font-medium text-emerald-400">+1.85 °C Headroom</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-emerald-400 h-2 rounded-full w-[78%]" />
          </div>
          <span className="text-[11px] text-slate-400">
            Operating safely below 34.0°C maximum design threshold.
          </span>
        </GlassCard>

        <GlassCard variant="subtle" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Sliding Window Buffer
            </span>
            <span className="text-xs font-medium text-cyan-300">12 / 12 Rows Ready</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-cyan-400 h-2 rounded-full w-[100%]" />
          </div>
          <span className="text-[11px] text-slate-400">
            Sufficient historical telemetry for rolling mean and lag calculations.
          </span>
        </GlassCard>

        <GlassCard variant="subtle" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Optimization Advisory
            </span>
            <span className="text-xs font-medium text-slate-300">Awaiting Trigger</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-slate-600 h-2 rounded-full w-[0%]" />
          </div>
          <span className="text-[11px] text-slate-400">
            Trigger candidate setpoint search to discover potential kWh trims.
          </span>
        </GlassCard>
      </div>
    </div>
  );
};
