// SPDX-License-Identifier: MIT
import React, { useId } from 'react';

export interface TimeSeriesPoint {
  step: number;
  label: string;
  series1: number;
  series2?: number;
}

export interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  series1Name: string;
  series1Unit: string;
  series1Color?: string;
  series2Name?: string;
  series2Unit?: string;
  series2Color?: string;
  height?: string;
  yDecimals?: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  series1Name,
  series1Unit,
  series1Color = '#22d3ee', // Cyan 400
  series2Name,
  series2Unit,
  series2Color = '#94a3b8', // Slate 400
  height = 'h-52 sm:h-56',
  yDecimals = 1,
}) => {
  const gradientId = useId();

  // If no data points yet
  if (!data || data.length === 0) {
    return (
      <div className={`w-full ${height} flex items-center justify-center text-xs text-slate-500 font-mono`}>
        Awaiting simulation data stream...
      </div>
    );
  }

  // Dimensions for SVG coordinate system
  const svgWidth = 560;
  const svgHeight = 180;
  const padLeft = 52;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 28;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Compute min and max across all series
  let allValues: number[] = [];
  data.forEach((d) => {
    if (typeof d.series1 === 'number' && !isNaN(d.series1)) {
      allValues.push(d.series1);
    }
    if (typeof d.series2 === 'number' && !isNaN(d.series2)) {
      allValues.push(d.series2);
    }
  });

  if (allValues.length === 0) {
    allValues = [0, 1];
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const rawRange = rawMax - rawMin;

  // Add 10% vertical padding so lines don't collide with edges
  const paddingMargin = rawRange > 0.001 ? rawRange * 0.15 : (rawMin * 0.1 || 1.0);
  const yMin = rawMin - paddingMargin;
  const yMax = rawMax + paddingMargin;
  const yRange = yMax - yMin;

  const getY = (val: number): number => {
    if (yRange <= 0) return padTop + plotHeight / 2;
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / yRange;
    return padTop + plotHeight - ratio * plotHeight;
  };

  const getX = (index: number): number => {
    if (data.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (data.length - 1)) * plotWidth;
  };

  // Build SVG path strings
  let path1 = '';
  let area1 = '';
  let path2 = '';

  if (data.length === 1) {
    const y1 = getY(data[0].series1);
    path1 = `M ${padLeft},${y1} L ${padLeft + plotWidth},${y1}`;
    if (data[0].series2 != null) {
      const y2 = getY(data[0].series2);
      path2 = `M ${padLeft},${y2} L ${padLeft + plotWidth},${y2}`;
    }
  } else {
    data.forEach((d, i) => {
      const x = getX(i);
      const y1 = getY(d.series1);
      if (i === 0) {
        path1 += `M ${x.toFixed(1)},${y1.toFixed(1)}`;
      } else {
        path1 += ` L ${x.toFixed(1)},${y1.toFixed(1)}`;
      }

      if (d.series2 != null) {
        const y2 = getY(d.series2);
        if (i === 0) {
          path2 += `M ${x.toFixed(1)},${y2.toFixed(1)}`;
        } else {
          path2 += ` L ${x.toFixed(1)},${y2.toFixed(1)}`;
        }
      }
    });

    // Area closed path
    const lastX = getX(data.length - 1);
    const bottomY = padTop + plotHeight;
    area1 = `${path1} L ${lastX.toFixed(1)},${bottomY} L ${padLeft},${bottomY} Z`;
  }

  // 4 horizontal grid intervals
  const gridSteps = 3;
  const gridLines = [];
  for (let i = 0; i <= gridSteps; i++) {
    const ratio = i / gridSteps;
    const val = yMin + ratio * yRange;
    const y = padTop + plotHeight - ratio * plotHeight;
    gridLines.push({ val, y });
  }

  // X-axis label points
  const xLabels: { text: string; x: number }[] = [];
  if (data.length === 1) {
    xLabels.push({ text: data[0].label, x: padLeft + plotWidth / 2 });
  } else {
    xLabels.push({ text: data[0].label, x: padLeft });
    if (data.length >= 6) {
      const midIdx = Math.floor(data.length / 2);
      xLabels.push({ text: data[midIdx].label, x: getX(midIdx) });
    }
    xLabels.push({ text: data[data.length - 1].label, x: padLeft + plotWidth });
  }

  const latestPoint = data[data.length - 1];
  const latestX = getX(data.length - 1);
  const latestY1 = getY(latestPoint.series1);

  return (
    <div className={`w-full ${height} relative flex flex-col justify-between overflow-hidden select-none`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series1Color} stopOpacity="0.25" />
            <stop offset="85%" stopColor={series1Color} stopOpacity="0.02" />
            <stop offset="100%" stopColor={series1Color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y-axis labels */}
        {gridLines.map((gl, idx) => (
          <g key={idx}>
            <line
              x1={padLeft}
              y1={gl.y}
              x2={padLeft + plotWidth}
              y2={gl.y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray={idx === 0 || idx === gridSteps ? 'none' : '3 3'}
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={gl.y + 3.5}
              textAnchor="end"
              fill="rgba(148, 163, 184, 0.6)"
              fontSize="9.5"
              fontFamily="var(--font-mono)"
            >
              {gl.val.toFixed(yDecimals)}
            </text>
          </g>
        ))}

        {/* Area fill under primary series */}
        {area1 && <path d={area1} fill={`url(#${gradientId})`} />}

        {/* Secondary reference series (e.g. Lagged Reference) */}
        {path2 && (
          <path
            d={path2}
            fill="none"
            stroke={series2Color}
            strokeWidth="1.75"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        )}

        {/* Primary series line */}
        {path1 && (
          <path
            d={path1}
            fill="none"
            stroke={series1Color}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Leading point beacon */}
        {data.length > 0 && (
          <g transform={`translate(${latestX}, ${latestY1})`}>
            <circle r="7" fill={series1Color} opacity="0.3" className="animate-ping" />
            <circle r="4.5" fill={series1Color} stroke="#070a12" strokeWidth="1.5" />
          </g>
        )}

        {/* X-axis ticks & labels */}
        {xLabels.map((xl, idx) => {
          const anchor = idx === 0 ? 'start' : idx === xLabels.length - 1 ? 'end' : 'middle';
          return (
            <text
              key={idx}
              x={xl.x}
              y={svgHeight - 8}
              textAnchor={anchor}
              fill="rgba(148, 163, 184, 0.7)"
              fontSize="9.5"
              fontFamily="var(--font-mono)"
            >
              {xl.text}
            </text>
          );
        })}
      </svg>

      {/* Numerical Callout Tag Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-3 bg-slate-950/80 px-2 py-1 rounded-md border border-white/10 text-[11px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series1Color }} />
          <span className="text-slate-300">{series1Name}:</span>
          <span className="font-semibold text-white">
            {latestPoint.series1.toFixed(yDecimals)} {series1Unit}
          </span>
        </div>
        {series2Name && latestPoint.series2 != null && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <span className="w-2 h-0.5" style={{ backgroundColor: series2Color }} />
            <span className="text-slate-400">{series2Name}:</span>
            <span className="font-semibold text-slate-300">
              {latestPoint.series2.toFixed(yDecimals)} {series2Unit ?? series1Unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
