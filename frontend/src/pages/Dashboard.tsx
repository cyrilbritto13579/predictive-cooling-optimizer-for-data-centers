// SPDX-License-Identifier: MIT
import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FastForward,
  Pause,
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
import { LoadingState } from '../components/feedback/LoadingState';
import { ErrorState } from '../components/feedback/ErrorState';
import { TimeSeriesChart } from '../components/dashboard/TimeSeriesChart';
import { useSimulationPlayback } from '../hooks/useSimulationPlayback';

export const Dashboard: React.FC = () => {
  const {
    playbackStatus,
    currentFrame,
    chartHistory,
    currentStepIndex,
    totalSteps,
    isLoading,
    error,
    stepError,
    startPlayback,
    pausePlayback,
    resetPlayback,
    retryInitialization,
  } = useSimulationPlayback();

  // Convert chart history into typed series for Energy
  const energyChartData = useMemo(() => {
    return chartHistory.map((frame) => ({
      step: frame.step_index,
      label: `S${frame.step_index + 1}`,
      series1: frame.predicted_energy_kwh,
      series2: frame.lagged_energy_kwh,
    }));
  }, [chartHistory]);

  // Convert chart history into typed series for Temperature
  const tempChartData = useMemo(() => {
    return chartHistory.map((frame) => ({
      step: frame.step_index,
      label: `S${frame.step_index + 1}`,
      series1: frame.predicted_temp_c,
    }));
  }, [chartHistory]);

  // If loading initially with no data
  if (isLoading && !currentFrame) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <LoadingState
          message="Loading deterministic simulation dataset..."
          description="Connecting to FastAPI backend /api/data/sample and initializing baseline step."
        />
      </div>
    );
  }

  // If initial load failed
  if (error && !currentFrame) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <ErrorState
          title="Simulation Initialization Failed"
          message={error}
          detail="Ensure FastAPI backend is running on http://127.0.0.1:8000 and data/sample_test_data.csv is accessible."
          onRetry={retryInitialization}
        />
      </div>
    );
  }

  const sampleNum = currentStepIndex + 1;
  const isAtEnd = sampleNum >= totalSteps || playbackStatus === 'completed';

  // Chiller power delta calculation
  const energyDelta = currentFrame
    ? (() => {
        const diff = currentFrame.predicted_energy_kwh - currentFrame.lagged_energy_kwh;
        return {
          value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} kWh`,
          trend: (diff <= 0 ? 'positive' : 'warning') as 'positive' | 'warning',
          label: 'vs 1-hr lag',
        };
      })()
    : undefined;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 1. Header & Controls Ribbon */}
      <SectionHeader
        title="Live Telemetry Analytics"
        subtitle="Deterministic simulation replay, predictive power forecasting, and thermal constraint monitoring."
        badge={
          <span
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
              playbackStatus === 'playing'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : playbackStatus === 'completed'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : playbackStatus === 'paused'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
            }`}
          >
            {playbackStatus === 'playing'
              ? 'Replay Active'
              : playbackStatus === 'completed'
              ? 'Replay Complete'
              : playbackStatus === 'paused'
              ? 'Replay Paused'
              : 'Deterministic Replay'}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              id="reset-playback-btn"
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={resetPlayback}
              disabled={isLoading || (currentStepIndex === 0 && chartHistory.length <= 1 && playbackStatus === 'idle')}
            >
              Reset
            </Button>
            {playbackStatus === 'playing' ? (
              <Button
                id="pause-playback-btn"
                variant="outline"
                size="sm"
                leftIcon={<Pause className="w-3.5 h-3.5" />}
                onClick={pausePlayback}
              >
                Pause Playback
              </Button>
            ) : isAtEnd ? (
              <Button
                id="reset-replay-btn"
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={resetPlayback}
              >
                Replay Complete (Reset)
              </Button>
            ) : (
              <Button
                id="start-playback-btn"
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={startPlayback}
                disabled={isLoading || !!error}
              >
                {playbackStatus === 'paused' ? 'Resume Playback' : 'Start Playback'}
              </Button>
            )}
          </div>
        }
      />

      {/* Step error banner (if transient error during playback) */}
      {stepError && (
        <div className="glass-panel rounded-xl border border-rose-500/30 p-3 flex items-center justify-between text-xs text-rose-300 bg-rose-950/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Simulation playback interrupted: {stepError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={startPlayback}>
            Resume
          </Button>
        </div>
      )}

      {/* 2. Simulation State & Playback Banner */}
      <div className="glass-panel-subtle rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-cyan-500/20">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              playbackStatus === 'playing'
                ? 'bg-emerald-400 animate-pulse'
                : playbackStatus === 'completed'
                ? 'bg-cyan-400'
                : playbackStatus === 'paused'
                ? 'bg-amber-400'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-slate-300 font-medium">Deterministic Simulation Replay:</span>
          <span className="number-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            Sample {sampleNum} / {totalSteps}
          </span>
          <span className="text-slate-400 font-mono hidden md:inline">
            Timestamp: {currentFrame?.timestamp ? currentFrame.timestamp : '— (Replay Mode)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          {playbackStatus === 'playing' && (
            <span className="text-emerald-300 font-medium">Replaying (1.0s interval)</span>
          )}
          {playbackStatus === 'paused' && (
            <span className="text-amber-300 font-medium">Paused at Sample {sampleNum}</span>
          )}
          {playbackStatus === 'completed' && (
            <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Replay Complete
            </span>
          )}
          {playbackStatus === 'idle' && (
            <span className="text-slate-400">
              Deterministic source: <code className="text-cyan-300">data/sample_test_data.csv</code>
            </span>
          )}
          <FastForward className="w-3.5 h-3.5 text-cyan-400 ml-1" />
        </div>
      </div>

      {/* 3. Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Chiller Power Consumption"
          value={currentFrame ? currentFrame.predicted_energy_kwh.toFixed(2) : '—'}
          unit="kWh"
          icon={<Zap className="w-4 h-4" />}
          delta={energyDelta}
          subtitle="Forecast Baseline"
          variant="accent"
        />

        <KpiCard
          label="Cooling Water Temperature"
          value={currentFrame ? currentFrame.predicted_temp_c.toFixed(2) : '—'}
          unit="°C"
          icon={<Thermometer className="w-4 h-4" />}
          delta={{ value: 'Monitored', trend: 'positive', label: '1-hr forecast' }}
          subtitle="1-Hour Ahead Projected"
        />

        <KpiCard
          label="Potential Energy Trimming"
          value="—"
          unit="%"
          icon={<TrendingDown className="w-4 h-4" />}
          delta={{ value: 'Awaiting Step', trend: 'neutral', label: 'Phase 7' }}
          subtitle="Optimization Inactive"
        />

        <KpiCard
          label="Chilled Water Flow Rate"
          value={currentFrame ? currentFrame.current_chilled_water_rate.toFixed(1) : '—'}
          unit="L/sec"
          icon={<Sliders className="w-4 h-4" />}
          delta={{ value: `Sample ${sampleNum}`, trend: 'neutral', label: 'observed' }}
          subtitle="Simulation Telemetry"
        />
      </div>

      {/* 4. Chart Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Energy Consumption Chart */}
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
                <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> Predicted Energy
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                <span className="w-2.5 h-0.5 bg-slate-500 rounded-full" /> Lagged Reference
              </span>
            </div>
          }
        >
          <div className="w-full rounded-xl bg-slate-950/40 border border-white/5 p-2 sm:p-3 overflow-hidden">
            <TimeSeriesChart
              data={energyChartData}
              series1Name="Predicted Energy"
              series1Unit="kWh"
              series1Color="#22d3ee"
              series2Name="Lagged Reference"
              series2Unit="kWh"
              series2Color="#94a3b8"
              yDecimals={1}
            />
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
              <span className="text-slate-400 ml-2">Celsius (°C)</span>
            </div>
          }
        >
          <div className="w-full rounded-xl bg-slate-950/40 border border-white/5 p-2 sm:p-3 overflow-hidden">
            <TimeSeriesChart
              data={tempChartData}
              series1Name="Predicted Temp"
              series1Unit="°C"
              series1Color="#818cf8"
              yDecimals={2}
            />
          </div>
        </GlassCard>
      </div>

      {/* 5. Facility Subsystem Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="subtle" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Thermal Safety Status
            </span>
            <span className="text-xs font-medium text-cyan-300">
              {currentFrame ? `Monitored: ${currentFrame.predicted_temp_c.toFixed(2)} °C` : 'Awaiting Data'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-cyan-500/40 h-2 rounded-full w-[65%]" />
          </div>
          <span className="text-[11px] text-slate-400">
            Thermal safety constraint evaluation will be active in Phase 7 optimization.
          </span>
        </GlassCard>

        <GlassCard variant="subtle" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Sliding Window Buffer
            </span>
            <span className="text-xs font-medium text-cyan-300">46 Features Baked</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-cyan-400 h-2 rounded-full w-[100%]" />
          </div>
          <span className="text-[11px] text-slate-400">
            12-step lag and rolling statistics pre-computed in canonical replay fixture.
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
            <div className="bg-slate-700 h-2 rounded-full w-[0%]" />
          </div>
          <span className="text-[11px] text-slate-400">
            Counterfactual grid search optimization connector scheduled for Phase 7.
          </span>
        </GlassCard>
      </div>
    </div>
  );
};
