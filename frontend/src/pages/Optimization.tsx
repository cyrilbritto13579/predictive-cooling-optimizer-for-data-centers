// SPDX-License-Identifier: MIT
import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';

interface CandidateRow {
  adjustment: number;
  flowRate: number;
  energyKwh: number;
  tempC: number;
  isSafe: boolean;
  isSelected: boolean;
}

const PLACEHOLDER_CANDIDATES: CandidateRow[] = [
  { adjustment: -1.0, flowRate: 9.5, energyKwh: 128.95, tempC: 32.85, isSafe: true, isSelected: false },
  { adjustment: -0.5, flowRate: 10.0, energyKwh: 128.60, tempC: 32.40, isSafe: true, isSelected: true },
  { adjustment: 0.0, flowRate: 10.5, energyKwh: 128.83, tempC: 32.15, isSafe: true, isSelected: false },
  { adjustment: +0.5, flowRate: 11.0, energyKwh: 129.20, tempC: 31.90, isSafe: true, isSelected: false },
  { adjustment: +1.0, flowRate: 11.5, energyKwh: 129.75, tempC: 31.65, isSafe: true, isSelected: false },
];

export const Optimization: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. Header */}
      <SectionHeader
        title="Cooling Setpoint Optimization"
        subtitle="Counterfactual grid evaluation of chilled-water flow rates to discover optimal energy operating points within thermal safety bounds."
        badge={
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Phase 5 Visual Skeleton
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Reset Grid
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              disabled
            >
              Run Optimizer (Phase 7)
            </Button>
          </div>
        }
      />

      {/* 2. Top Summary Row: Baseline vs Recommended Point */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Card */}
        <GlassCard
          variant="subtle"
          title="Current Baseline Point"
          subtitle="Nominal operating setpoint without adjustment"
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Chilled Water Flow:</span>
              <span className="text-sm font-semibold text-white number-mono">10.50 L/sec</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Baseline Energy:</span>
              <span className="text-xl font-bold text-slate-200 number-mono">128.83 kWh</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Baseline Temp:</span>
              <span className="text-sm font-medium text-slate-300 number-mono">32.15 °C</span>
            </div>
          </div>
        </GlassCard>

        {/* Recommended Optimal Point */}
        <GlassCard
          variant="accent"
          title="Recommended Optimal Point"
          subtitle="Model-selected candidate minimizing power draw"
          badge={
            <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
              Optimal
            </span>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Selected Setpoint:</span>
              <span className="text-sm font-semibold text-cyan-300 number-mono">10.00 L/sec (-0.50)</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Optimized Energy:</span>
              <span className="text-xl font-bold text-emerald-400 number-mono">128.60 kWh</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Projected Temp:</span>
              <span className="text-sm font-medium text-slate-300 number-mono">32.40 °C (Safe)</span>
            </div>
          </div>
        </GlassCard>

        {/* Energy Savings & Difference */}
        <GlassCard
          variant="subtle"
          title="Estimated Reduction"
          subtitle="Counterfactual difference between baseline and optimal"
        >
          <div className="flex flex-col justify-center h-full py-2">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-emerald-400 number-mono">
                -0.23
              </span>
              <span className="text-sm font-medium text-slate-400">kWh / cycle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                -0.18% Savings
              </span>
              <span className="text-[11px] text-slate-400">within ±0.5°C thermal drift</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Candidate Operating Points Table */}
      <GlassCard
        title="Candidate Grid Search Points"
        subtitle="Evaluated flow adjustments [-1.0, -0.5, 0.0, +0.5, +1.0] L/sec against trained XGBoost model curves."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Adjustment (Δ Flow)</th>
                <th className="py-3 px-4">Candidate Setpoint</th>
                <th className="py-3 px-4">Predicted Energy</th>
                <th className="py-3 px-4">Predicted Temp</th>
                <th className="py-3 px-4">Thermal Safety Constraint</th>
                <th className="py-3 px-4 text-right">Selection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {PLACEHOLDER_CANDIDATES.map((c) => (
                <tr
                  key={c.adjustment}
                  className={`transition-colors ${
                    c.isSelected
                      ? 'bg-emerald-500/10 text-white font-medium border-l-2 border-l-emerald-400'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-200">
                      {c.adjustment > 0 ? `+${c.adjustment.toFixed(1)}` : c.adjustment.toFixed(1)} L/s
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {c.flowRate.toFixed(2)} L/sec
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={c.isSelected ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                      {c.energyKwh.toFixed(2)} kWh
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {c.tempC.toFixed(2)} °C
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    {c.isSafe ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Satisfied (≤ 34.0°C)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Violated (&gt; 34.0°C)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {c.isSelected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        Selected Optimal
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scientific Disclaimer */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-300 font-medium">Scientific Validation Note:</strong> Values represent counterfactual model-estimated energy differences, not physically measured real-world savings. Real-time optimization calculation and constraint binding will be wired directly to <code className="text-cyan-300 bg-cyan-950/40 px-1 py-0.5 rounded">POST /api/optimize</code> in Phase 7.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
