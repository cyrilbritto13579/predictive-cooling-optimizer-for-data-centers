// SPDX-License-Identifier: MIT
import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { EnergyTempTradeoffChart } from '../components/optimization/EnergyTempTradeoffChart';
import { getSampleData } from '../api/data';
import { optimizeCooling } from '../api/optimization';
import type { CandidatePoint, OptimizationResponse } from '../types';

type SortField =
  | 'adjustment'
  | 'flowRate'
  | 'energy'
  | 'energyDelta'
  | 'temperature'
  | 'satisfies';

export const Optimization: React.FC = () => {
  // Scenario state
  const [sampleRows, setSampleRows] = useState<Record<string, number>[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(true);
  const [sampleError, setSampleError] = useState<string | null>(null);

  // Constraint state
  const [useConstraint, setUseConstraint] = useState<boolean>(false);
  const [tempConstraintValue, setTempConstraintValue] = useState<number>(32.5);

  // Optimization run state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<OptimizationResponse | null>(null);
  const [resultScenarioIndex, setResultScenarioIndex] = useState<number | null>(null);

  // Table sorting
  const [sortField, setSortField] = useState<SortField>('adjustment');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Load sample scenarios on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSamples() {
      try {
        setIsLoadingSamples(true);
        setSampleError(null);
        const data = await getSampleData(0, 50);
        if (isMounted) {
          if (data.rows && data.rows.length > 0) {
            setSampleRows(data.rows as Record<string, number>[]);
          } else {
            setSampleError('No sample scenarios returned by API.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to connect to backend for sample scenarios.';
          setSampleError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSamples(false);
        }
      }
    }
    loadSamples();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentScenario = sampleRows[selectedRowIndex] || null;

  // Handle explicit optimization run
  const handleRunOptimization = async () => {
    if (!currentScenario || isOptimizing) return;

    setIsOptimizing(true);
    setOptimizationError(null);

    try {
      const response = await optimizeCooling({
        pre_engineered_row: currentScenario,
        include_temp: true,
        temperature_constraint_max: useConstraint ? tempConstraintValue : null,
      });

      setActiveResult(response);
      setResultScenarioIndex(selectedRowIndex);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Optimization request failed.';
      setOptimizationError(msg);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setActiveResult(null);
    setResultScenarioIndex(null);
    setOptimizationError(null);
  };

  // Sort candidates
  const candidates: CandidatePoint[] = activeResult ? [...activeResult.candidates] : [];
  candidates.sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'adjustment':
        diff = a.chilled_water_rate_adjustment - b.chilled_water_rate_adjustment;
        break;
      case 'flowRate':
        diff = a.chilled_water_rate - b.chilled_water_rate;
        break;
      case 'energy':
        diff = a.predicted_energy_kwh - b.predicted_energy_kwh;
        break;
      case 'energyDelta':
        diff = a.energy_delta_kwh - b.energy_delta_kwh;
        break;
      case 'temperature':
        diff = (a.predicted_temp_c ?? 0) - (b.predicted_temp_c ?? 0);
        break;
      case 'satisfies':
        diff = Number(b.satisfies_temp_constraint ?? 0) - Number(a.satisfies_temp_constraint ?? 0);
        break;
      default:
        diff = 0;
    }
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Identify selected candidate
  const selectedCandidate = activeResult?.candidates.find((c) => c.is_selected) ?? null;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header */}
      <SectionHeader
        title="Cooling Setpoint Optimization"
        subtitle="Canonical XGBoost grid evaluation of chilled-water flow rates to identify optimal counterfactual operating setpoints and evaluate cooling-water thermal constraints."
        badge={
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Canonical Optimizer
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleReset}
              disabled={isOptimizing || !activeResult}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              onClick={handleRunOptimization}
              disabled={isOptimizing || isLoadingSamples || !currentScenario}
            >
              {isOptimizing ? 'Evaluating Grid...' : 'Run Optimization'}
            </Button>
          </div>
        }
      />

      {/* 2. Scenario Configuration & Operational Constraints */}
      <GlassCard
        title="Input Operating Scenario & Thermal Constraints"
        subtitle="Select a verified telemetry scenario from the replay dataset and optionally configure a cooling-water temperature threshold."
        variant="default"
      >
        <div className="flex flex-col gap-5">
          {/* Scenario Selector & Telemetry Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Scenario Picker */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <label htmlFor="scenario-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Operating Scenario (Sample Index)
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="scenario-select"
                  aria-label="Operating Scenario Sample Index"
                  value={selectedRowIndex}
                  onChange={(e) => {
                    setSelectedRowIndex(Number(e.target.value));
                    setOptimizationError(null);
                  }}
                  disabled={isLoadingSamples || isOptimizing}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {sampleRows.map((_, idx) => (
                    <option key={`sample-${idx}`} value={idx}>
                      Scenario #{idx} {idx === 0 ? '(Default Test Setpoint)' : ''}
                    </option>
                  ))}
                </select>
                {isLoadingSamples && (
                  <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                50 real scenarios from historical chiller telemetry dataset.
              </span>
            </div>

            {/* Current Scenario Readings Snapshot */}
            <div className="lg:col-span-8 bg-slate-900/50 border border-white/5 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Scenario #{selectedRowIndex} Baseline Telemetry
              </div>
              {currentScenario ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Chilled Water Flow</span>
                    <span className="text-cyan-300 font-bold">
                      {currentScenario['Chilled Water Rate (L/sec)']?.toFixed(2)} L/s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Cooling Water Temp</span>
                    <span className="text-slate-200 font-bold">
                      {currentScenario['Cooling Water Temperature (C)']?.toFixed(2)} °C
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Building Load</span>
                    <span className="text-slate-200 font-bold">
                      {currentScenario['Building Load (RT)']?.toFixed(1)} RT
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Outside Ambient</span>
                    <span className="text-slate-200 font-bold">
                      {currentScenario['Outside Temperature (F)']?.toFixed(1)} °F
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Relative Humidity</span>
                    <span className="text-slate-200 font-bold">
                      {currentScenario['Humidity (%)']?.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Loading telemetry snapshot...</div>
              )}
            </div>
          </div>

          {/* Thermal Constraint Settings */}
          <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 max-w-xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-temp-constraint"
                  checked={useConstraint}
                  onChange={(e) => setUseConstraint(e.target.checked)}
                  disabled={isOptimizing}
                  className="rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="enable-temp-constraint"
                  className="text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Apply Operational Cooling-Water Temperature Constraint
                </label>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                By default, evaluation is <strong>unconstrained</strong> because no authoritative operational limit exists in legacy project evidence. Enabling a threshold filters candidate setpoints by projected cooling-water temperature.
              </p>
            </div>

            {useConstraint && (
              <div className="flex items-center gap-3 bg-slate-900/80 border border-cyan-500/30 rounded-lg p-2.5">
                <label htmlFor="temp-max-input" className="text-xs font-medium text-slate-300">
                  Max Limit:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="temp-max-input"
                    type="number"
                    step="0.1"
                    min="20.0"
                    max="40.0"
                    value={tempConstraintValue}
                    onChange={(e) => setTempConstraintValue(parseFloat(e.target.value) || 32.5)}
                    disabled={isOptimizing}
                    className="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">°C</span>
                </div>
                <div className="flex gap-1">
                  {[32.0, 32.5, 33.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempConstraintValue(preset)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors font-mono ${
                        tempConstraintValue === preset
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {preset.toFixed(1)}°
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Error & Warning Notifications */}
      {sampleError && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{sampleError}</span>
        </div>
      )}

      {optimizationError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Optimization request failed:</strong> {optimizationError}
            {activeResult && resultScenarioIndex !== null && (
              <p className="text-amber-200/80 text-[11px] mt-1">
                Showing previously successful evaluation results from Scenario #{resultScenarioIndex}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. Top Summary Row: Baseline vs Recommended vs Estimated Difference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Card */}
        <GlassCard
          variant="subtle"
          title="Current Baseline Setpoint"
          subtitle={
            activeResult
              ? `Scenario #${resultScenarioIndex ?? selectedRowIndex} operating point`
              : 'Nominal operating point without adjustment'
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Baseline Flow Rate:</span>
              <span className="text-sm font-semibold text-white number-mono">
                {activeResult
                  ? `${activeResult.current_chilled_water_rate.toFixed(2)} L/sec`
                  : currentScenario
                  ? `${currentScenario['Chilled Water Rate (L/sec)']?.toFixed(2)} L/sec`
                  : '--'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Baseline Predicted Energy:</span>
              <span className="text-xl font-bold text-slate-200 number-mono">
                {activeResult ? `${activeResult.baseline_energy_kwh.toFixed(2)} kWh` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Baseline Predicted Temp:</span>
              <span className="text-sm font-medium text-slate-300 number-mono">
                {activeResult?.baseline_temp_c !== null && activeResult?.baseline_temp_c !== undefined
                  ? `${activeResult.baseline_temp_c.toFixed(2)} °C`
                  : '--'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Recommended Candidate Card */}
        <GlassCard
          variant="accent"
          title="Recommended Candidate Setpoint"
          subtitle={
            !activeResult
              ? 'Awaiting optimization run'
              : activeResult.evaluation_status === 'no_feasible_candidate'
              ? 'No candidate satisfies thermal constraint'
              : activeResult.evaluation_status === 'constrained_optimal'
              ? 'Lowest energy satisfying thermal bound'
              : 'Lowest energy unconstrained candidate'
          }
          badge={
            !activeResult ? (
              <span className="text-[10px] font-mono uppercase bg-slate-500/20 text-slate-300 px-1.5 py-0.5 rounded border border-white/10">
                Pending
              </span>
            ) : activeResult.evaluation_status === 'no_feasible_candidate' ? (
              <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                Infeasible
              </span>
            ) : activeResult.evaluation_status === 'constrained_optimal' ? (
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Constrained Optimal
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Unconstrained Optimal
              </span>
            )
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Selected Setpoint:</span>
              <span className="text-sm font-semibold text-cyan-300 number-mono">
                {activeResult && selectedCandidate
                  ? `${selectedCandidate.chilled_water_rate.toFixed(2)} L/s (${
                      selectedCandidate.chilled_water_rate_adjustment >= 0 ? '+' : ''
                    }${selectedCandidate.chilled_water_rate_adjustment.toFixed(1)})`
                  : activeResult?.evaluation_status === 'no_feasible_candidate'
                  ? 'Baseline Retained'
                  : '--'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Optimized Predicted Energy:</span>
              <span className="text-xl font-bold text-emerald-400 number-mono">
                {activeResult ? `${activeResult.optimized_energy_kwh.toFixed(2)} kWh` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Projected Cooling Temp:</span>
              <span className="text-sm font-medium text-slate-300 number-mono">
                {selectedCandidate?.predicted_temp_c !== null && selectedCandidate?.predicted_temp_c !== undefined
                  ? `${selectedCandidate.predicted_temp_c.toFixed(2)} °C`
                  : activeResult
                  ? `${activeResult.baseline_temp_c?.toFixed(2)} °C`
                  : '--'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Estimated Counterfactual Energy Difference */}
        <GlassCard
          variant="subtle"
          title="Estimated Energy Difference"
          subtitle="Counterfactual model estimate (baseline − candidate)"
        >
          <div className="flex flex-col justify-center h-full py-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-emerald-400 number-mono">
                {activeResult ? `-${activeResult.estimated_energy_reduction_kwh.toFixed(2)}` : '0.00'}
              </span>
              <span className="text-sm font-medium text-slate-400">kWh / cycle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {activeResult ? `${activeResult.savings_percent.toFixed(2)}% Reduction` : '0.00%'}
              </span>
              <span className="text-[11px] text-slate-400">
                {activeResult?.evaluation_status === 'constrained_optimal'
                  ? `within ≤ ${activeResult.temperature_constraint_max?.toFixed(1)}°C bound`
                  : activeResult?.evaluation_status === 'no_feasible_candidate'
                  ? 'no savings within constraint'
                  : 'unconstrained evaluation'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic leading-tight">
              Results are model-based counterfactual estimates, not verified physical energy savings. Actual performance may differ.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* 4. Energy–Temperature Trade-Off Scatter Chart */}
      <GlassCard
        title="Energy–Temperature Trade-Off Curve"
        subtitle="Counterfactual trade-off between predicted chiller energy (kWh) and predicted cooling-water temperature (°C) across candidate chilled-water flow rates."
      >
        <EnergyTempTradeoffChart
          candidates={candidates}
          baselineEnergy={activeResult?.baseline_energy_kwh ?? null}
          baselineTemp={activeResult?.baseline_temp_c ?? null}
          temperatureConstraintMax={activeResult?.temperature_constraint_max ?? null}
          selectedCandidate={selectedCandidate}
        />
      </GlassCard>

      {/* 5. Candidate Operating Points Table */}
      <GlassCard
        title="Evaluated Candidate Operating Points"
        subtitle="Grid points [-5.0, -2.0, -1.0, 0.0, +1.0, +2.0, +5.0] L/sec evaluated using the canonical chained XGBoost model pipeline."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('adjustment')}
                >
                  <div className="flex items-center gap-1">
                    <span>Flow Adjustment</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('flowRate')}
                >
                  <div className="flex items-center gap-1">
                    <span>Candidate Setpoint</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('energy')}
                >
                  <div className="flex items-center gap-1">
                    <span>Predicted Energy</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('energyDelta')}
                >
                  <div className="flex items-center gap-1">
                    <span>Δ from Baseline</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('temperature')}
                >
                  <div className="flex items-center gap-1">
                    <span>Predicted Temp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('satisfies')}
                >
                  <div className="flex items-center gap-1">
                    <span>Thermal Constraint Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Selection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {candidates.length > 0 ? (
                candidates.map((c) => {
                  const isBaseline = c.chilled_water_rate_adjustment === 0;
                  const isSelected = c.is_selected;
                  const isViolating = c.satisfies_temp_constraint === false;

                  return (
                    <tr
                      key={c.chilled_water_rate_adjustment}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/10 text-white font-medium border-l-2 border-l-emerald-400'
                          : isViolating
                          ? 'bg-rose-500/5 text-slate-300 hover:bg-rose-500/10'
                          : isBaseline
                          ? 'bg-cyan-500/5 text-slate-200 hover:bg-cyan-500/10'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {/* Flow Adjustment */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">
                          {c.chilled_water_rate_adjustment > 0
                            ? `+${c.chilled_water_rate_adjustment.toFixed(1)}`
                            : c.chilled_water_rate_adjustment.toFixed(1)}{' '}
                          L/s
                        </span>
                        {isBaseline && (
                          <span className="ml-2 text-[10px] text-cyan-400 font-sans font-normal">
                            (Current Setpoint)
                          </span>
                        )}
                      </td>

                      {/* Candidate Setpoint */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {c.chilled_water_rate.toFixed(2)} L/sec
                      </td>

                      {/* Predicted Energy */}
                      <td className="py-3.5 px-4">
                        <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                          {c.predicted_energy_kwh.toFixed(3)} kWh
                        </span>
                      </td>

                      {/* Δ from Baseline */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            c.energy_delta_kwh < -0.001
                              ? 'text-emerald-400'
                              : c.energy_delta_kwh > 0.001
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {c.energy_delta_kwh >= 0 ? '+' : ''}
                          {c.energy_delta_kwh.toFixed(3)} kWh
                        </span>
                      </td>

                      {/* Predicted Temp */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {c.predicted_temp_c !== null ? `${c.predicted_temp_c.toFixed(2)} °C` : '--'}
                      </td>

                      {/* Thermal Constraint Status */}
                      <td className="py-3.5 px-4 font-sans">
                        {c.satisfies_temp_constraint === true ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Satisfied (≤ {activeResult?.temperature_constraint_max?.toFixed(1)}°C)</span>
                          </span>
                        ) : c.satisfies_temp_constraint === false ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Violated (&gt; {activeResult?.temperature_constraint_max?.toFixed(1)}°C)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs inline-flex items-center gap-1">
                            <span>Unconstrained</span>
                            <span className="text-[10px] text-slate-500">(No limit set)</span>
                          </span>
                        )}
                      </td>

                      {/* Selection Status */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                            Selected Optimal
                          </span>
                        ) : isViolating ? (
                          <span className="text-rose-400 text-xs">Ineligible (Violates Limit)</span>
                        ) : isBaseline ? (
                          <span className="text-cyan-400/80 text-xs">Baseline Reference</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Evaluated Candidate</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No optimization results to display. Select a scenario above and click{' '}
                    <strong className="text-cyan-400 font-semibold">"Run Optimization"</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Suggestion notice if present */}
        {activeResult?.suggestion && (
          <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg flex items-start gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300">Optimizer Recommendation:</strong>{' '}
              {activeResult.suggestion}
            </div>
          </div>
        )}
      </GlassCard>

      {/* 6. Scientific Methodology & Integrity Explanatory Card */}
      <GlassCard
        title="Scientific Integrity & Methodology Disclaimers"
        variant="subtle"
      >
        <div className="flex flex-col gap-3 text-xs text-slate-400 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Model-Based Counterfactual Estimation:</strong>{' '}
              Energy consumption values and temperature forecasts represent counterfactual model estimates generated by the canonical XGBoost models, not physical measurements of realized energy savings in the field. Actual savings will vary depending on ambient heat gains, valve dynamics, and secondary pump efficiency.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Chained Prediction Pipeline:</strong>{' '}
              Temperature predictions are computed via the canonical chained architecture: the energy model first predicts instantaneous power consumption, which is then dynamically injected as the <code className="text-cyan-300 bg-cyan-950/40 px-1 py-0.5 rounded font-mono text-[11px]">Chiller Energy Consumption (kWh)</code> feature into the temperature model's 46-feature vector.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Thermal Safety Limits:</strong>{' '}
              Legacy project evidence contains observed training ranges [25.80°C, 36.20°C] but no authoritative physical maximum limit. Unless an operator configures an operational temperature constraint, candidate setpoints are evaluated without a safety gate. A software constraint evaluation does not guarantee real-world equipment safety.
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
