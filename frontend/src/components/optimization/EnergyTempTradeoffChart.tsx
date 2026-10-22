// SPDX-License-Identifier: MIT
import React, { useState } from 'react';
import type { CandidatePoint } from '../../types';

interface EnergyTempTradeoffChartProps {
  candidates: CandidatePoint[];
  baselineEnergy: number | null;
  baselineTemp: number | null;
  temperatureConstraintMax: number | null;
  selectedCandidate?: CandidatePoint | null;
  onSelectCandidate?: (candidate: CandidatePoint) => void;
}

export const EnergyTempTradeoffChart: React.FC<EnergyTempTradeoffChartProps> = ({
  candidates,
  baselineEnergy,
  baselineTemp,
  temperatureConstraintMax,
  selectedCandidate,
  onSelectCandidate,
}) => {
  const [hoveredCandidate, setHoveredCandidate] = useState<CandidatePoint | null>(null);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-xl bg-slate-900/30 text-slate-400 text-xs">
        <p>No candidate data available. Select a scenario and run optimization.</p>
      </div>
    );
  }

  // Filter valid points with both energy and temperature
  const validCandidates = candidates.filter(
    (c) => typeof c.predicted_energy_kwh === 'number' && typeof c.predicted_temp_c === 'number'
  );

  if (validCandidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-xl bg-slate-900/30 text-slate-400 text-xs">
        <p>Candidate points lack temperature predictions.</p>
      </div>
    );
  }

  // Calculate domain ranges with padding
  const allTemps = validCandidates.map((c) => c.predicted_temp_c as number);
  if (baselineTemp !== null) allTemps.push(baselineTemp);
  if (temperatureConstraintMax !== null) allTemps.push(temperatureConstraintMax);

  const allEnergies = validCandidates.map((c) => c.predicted_energy_kwh);
  if (baselineEnergy !== null) allEnergies.push(baselineEnergy);

  const minTempRaw = Math.min(...allTemps);
  const maxTempRaw = Math.max(...allTemps);
  const tempSpan = Math.max(maxTempRaw - minTempRaw, 0.5);
  const minTemp = minTempRaw - tempSpan * 0.12;
  const maxTemp = maxTempRaw + tempSpan * 0.12;

  const minEnergyRaw = Math.min(...allEnergies);
  const maxEnergyRaw = Math.max(...allEnergies);
  const energySpan = Math.max(maxEnergyRaw - minEnergyRaw, 0.5);
  const minEnergy = minEnergyRaw - energySpan * 0.15;
  const maxEnergy = maxEnergyRaw + energySpan * 0.15;

  // SVG dimensions
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 40, bottom: 45, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const scaleX = (temp: number) => {
    return padding.left + ((temp - minTemp) / (maxTemp - minTemp)) * plotWidth;
  };

  const scaleY = (energy: number) => {
    return padding.top + plotHeight - ((energy - minEnergy) / (maxEnergy - minEnergy)) * plotHeight;
  };

  // Generate 4-5 ticks for X (Temp) and Y (Energy)
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0].map((t) => minTemp + t * (maxTemp - minTemp));
  const yTicks = [0, 0.33, 0.66, 1.0].map((t) => minEnergy + t * (maxEnergy - minEnergy));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950/40 border border-white/10 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Energy versus Cooling-Water Temperature Trade-Off Chart"
        >
          {/* Subtle Grid Lines */}
          {yTicks.map((val, idx) => {
            const y = scaleY(val);
            return (
              <g key={`y-grid-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {xTicks.map((val, idx) => {
            const x = scaleX(val);
            return (
              <g key={`x-grid-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {val.toFixed(2)}°C
                </text>
              </g>
            );
          })}

          {/* Axes Titles */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            className="fill-slate-300 text-[11px] font-medium"
          >
            Predicted Cooling-Water Temperature (°C)
          </text>
          <text
            transform={`rotate(-90)`}
            x={-(padding.top + plotHeight / 2)}
            y={16}
            textAnchor="middle"
            className="fill-slate-300 text-[11px] font-medium"
          >
            Predicted Energy (kWh)
          </text>

          {/* Thermal Constraint Boundary (Only when constraint is configured) */}
          {temperatureConstraintMax !== null && (
            <g>
              <line
                x1={scaleX(temperatureConstraintMax)}
                y1={padding.top}
                x2={scaleX(temperatureConstraintMax)}
                y2={height - padding.bottom}
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <rect
                x={scaleX(temperatureConstraintMax) - 48}
                y={padding.top - 20}
                width="96"
                height="16"
                rx="3"
                fill="#f43f5e"
                fillOpacity="0.2"
                stroke="#f43f5e"
                strokeOpacity="0.5"
              />
              <text
                x={scaleX(temperatureConstraintMax)}
                y={padding.top - 8}
                textAnchor="middle"
                className="fill-rose-300 text-[9px] font-mono font-semibold"
              >
                Max Limit {temperatureConstraintMax.toFixed(1)}°C
              </text>
            </g>
          )}

          {/* Baseline Marker */}
          {baselineEnergy !== null && baselineTemp !== null && (
            <g className="cursor-pointer" onClick={() => onSelectCandidate?.(candidates.find(c => c.chilled_water_rate_adjustment === 0) || candidates[0])}>
              {/* Outer halo */}
              <circle
                cx={scaleX(baselineTemp)}
                cy={scaleY(baselineEnergy)}
                r="10"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                className="animate-spin-slow opacity-60"
              />
              {/* Diamond marker for baseline */}
              <polygon
                points={`
                  ${scaleX(baselineTemp)},${scaleY(baselineEnergy) - 7}
                  ${scaleX(baselineTemp) + 7},${scaleY(baselineEnergy)}
                  ${scaleX(baselineTemp)},${scaleY(baselineEnergy) + 7}
                  ${scaleX(baselineTemp) - 7},${scaleY(baselineEnergy)}
                `}
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={scaleX(baselineTemp) + 10}
                y={scaleY(baselineEnergy) - 8}
                className="fill-cyan-300 text-[10px] font-mono font-semibold"
              >
                Baseline (0.0)
              </text>
            </g>
          )}

          {/* Candidate Points */}
          {validCandidates.map((c, i) => {
            const x = scaleX(c.predicted_temp_c as number);
            const y = scaleY(c.predicted_energy_kwh);
            const isSelected = c.is_selected || (selectedCandidate && selectedCandidate.chilled_water_rate_adjustment === c.chilled_water_rate_adjustment);
            const isViolating = c.satisfies_temp_constraint === false;
            const isHovered = hoveredCandidate === c;

            let fillColor = '#06b6d4'; // default cyan
            let strokeColor = '#38bdf8';

            if (temperatureConstraintMax !== null) {
              if (isViolating) {
                fillColor = '#f43f5e'; // rose
                strokeColor = '#fda4af';
              } else {
                fillColor = '#10b981'; // emerald
                strokeColor = '#6ee7b7';
              }
            } else if (isSelected) {
              fillColor = '#10b981';
              strokeColor = '#a7f3d0';
            }

            return (
              <g
                key={`candidate-pt-${i}`}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setHoveredCandidate(c)}
                onMouseLeave={() => setHoveredCandidate(null)}
                onClick={() => onSelectCandidate?.(c)}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                )}
                {/* Target node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : isHovered ? 6 : 4.5}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected || isHovered ? 2 : 1.5}
                />
                {/* Label for delta */}
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className="fill-slate-300 text-[9px] font-mono font-medium pointer-events-none"
                >
                  {c.chilled_water_rate_adjustment > 0
                    ? `+${c.chilled_water_rate_adjustment.toFixed(1)}`
                    : `${c.chilled_water_rate_adjustment.toFixed(1)}`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredCandidate && (
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2.5 text-xs font-mono shadow-xl z-10 pointer-events-none">
            <div className="text-cyan-300 font-bold mb-1">
              Adjustment: {hoveredCandidate.chilled_water_rate_adjustment > 0 ? `+` : ''}
              {hoveredCandidate.chilled_water_rate_adjustment.toFixed(1)} L/s (
              {hoveredCandidate.chilled_water_rate.toFixed(2)} L/s)
            </div>
            <div className="text-slate-300">
              Energy: <span className="text-emerald-400 font-bold">{hoveredCandidate.predicted_energy_kwh.toFixed(3)} kWh</span>
            </div>
            <div className="text-slate-300">
              Temp: <span className="text-slate-100 font-bold">{hoveredCandidate.predicted_temp_c?.toFixed(2)} °C</span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1">
              Δ Energy: {hoveredCandidate.energy_delta_kwh >= 0 ? '+' : ''}
              {hoveredCandidate.energy_delta_kwh.toFixed(3)} kWh
            </div>
            {hoveredCandidate.satisfies_temp_constraint !== null && (
              <div
                className={`text-[10px] font-sans font-semibold mt-0.5 ${
                  hoveredCandidate.satisfies_temp_constraint ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {hoveredCandidate.satisfies_temp_constraint ? '✓ Within Temperature Constraint' : '⚠ Exceeds Temperature Constraint'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block border border-white" />
            <span>Baseline Operating Point</span>
          </div>
          {temperatureConstraintMax !== null ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300 inline-block" />
                <span>Satisfies Thermal Limit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300 inline-block" />
                <span>Violates Thermal Limit</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-cyan-300 inline-block" />
              <span>Unconstrained Candidate</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-400 inline-block" />
            <span>Selected Optimal</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          Showing {validCandidates.length} evaluated grid points
        </div>
      </div>
    </div>
  );
};
