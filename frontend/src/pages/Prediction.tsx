// SPDX-License-Identifier: MIT
import React from 'react';
import {
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';

export const Prediction: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. Header */}
      <SectionHeader
        title="Manual Telemetry Prediction"
        subtitle="Simulate arbitrary facility operating parameters to test forward energy demand and cooling water temperatures."
        badge={
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Phase 5 Visual Skeleton
          </span>
        }
      />

      {/* 2. Main Prediction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Input Operating Parameters */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassCard
            title="Operating & Environmental Parameters"
            subtitle="Raw sensor values fed into canonical 46-feature pipeline."
            action={
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Reset to Nominal
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Chilled Water Flow Rate (L/sec)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="10.5"
                    step="0.5"
                    min="5.0"
                    max="20.0"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 number-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">L/sec</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Valid range: 5.0 – 20.0 L/s</span>
              </div>

              {/* Field 2 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cooling Water Temperature (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="30.2"
                    step="0.1"
                    min="15.0"
                    max="45.0"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 number-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">°C</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Current condenser loop water</span>
              </div>

              {/* Field 3 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Building Thermal Load (kW)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="450.0"
                    step="10"
                    min="50"
                    max="1500"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 number-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">kW</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Server rack heat rejection load</span>
              </div>

              {/* Field 4 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Outside Ambient Temperature (°F)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="84.5"
                    step="0.5"
                    min="40.0"
                    max="120.0"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 number-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">°F</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Weather dry bulb temperature</span>
              </div>

              {/* Field 5 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Relative Humidity (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="78.0"
                    step="1"
                    min="10"
                    max="100"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 number-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Ambient relative humidity</span>
              </div>

              {/* Field 6 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Dew Point (°F)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="76.2"
                    step="0.5"
                    min="30"
                    max="100"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 number-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">°F</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Condenser cooling tower moisture index</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Feature synthesis transforms these parameters into 46 engineered features.</span>
              </div>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                disabled
              >
                Execute Forecast (Phase 7)
              </Button>
            </div>
          </GlassCard>

          {/* Integration Status Notice */}
          <div className="glass-panel-subtle p-4 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>
                Backend endpoint <code className="text-cyan-300 bg-cyan-950/50 px-1 py-0.5 rounded">POST /api/predict/combined</code> is verified & ready.
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">Binding to UI in Phase 7</span>
          </div>
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
                  --.--
                </span>
                <span className="text-sm font-semibold text-cyan-400">kWh</span>
              </div>
              <span className="text-xs text-slate-400 mt-2 block">
                Awaiting parameter submission
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
            </div>
          </GlassCard>

          {/* Temperature Output Card */}
          <GlassCard
            title="Cooling Water Temperature"
            subtitle="1-hour forward thermal projection"
            badge={
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                Chained Model
              </span>
            }
          >
            <div className="py-4 text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-white number-mono">
                  --.--
                </span>
                <span className="text-sm font-semibold text-indigo-400">°C</span>
              </div>
              <span className="text-xs text-slate-400 mt-2 block">
                Evaluated after energy inference
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Chained Dependency:</span>
                <span className="font-mono text-cyan-300">Energy (kWh)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Safe Boundary Limit:</span>
                <span className="font-mono text-rose-400">≤ 34.0 °C</span>
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
