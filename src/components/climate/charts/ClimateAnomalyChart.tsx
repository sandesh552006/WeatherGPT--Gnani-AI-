'use client';

import React, { useState } from 'react';

export interface AnomalyDatum {
  year: number;
  anomaly: number; // e.g. +1.2 or -0.8
  unit?: string;
}

interface ClimateAnomalyChartProps {
  data: AnomalyDatum[];
  unit?: string;
  height?: number;
  baselineLabel?: string;
}

export const ClimateAnomalyChart: React.FC<ClimateAnomalyChartProps> = ({
  data,
  unit = '°C',
  height = 240,
  baselineLabel = 'Historical Baseline (0.0°C)',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl"
      >
        No anomaly data available
      </div>
    );
  }

  const n = data.length;
  const anomalies = data.map((d) => d.anomaly);
  const maxAbs = Math.max(...anomalies.map((a) => Math.abs(a)), 1.0);
  const bound = Number((Math.ceil(maxAbs * 10) / 10 + 0.2).toFixed(1));

  const viewBoxWidth = 800;
  const viewBoxHeight = height;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  // Zero baseline Y position
  const zeroY = padding.top + plotHeight / 2;

  const getY = (val: number) => {
    // val is between -bound and +bound
    const norm = val / bound; // -1 to +1
    return zeroY - norm * (plotHeight / 2);
  };

  const slotWidth = plotWidth / n;
  const barWidth = Math.max(Math.min(slotWidth * 0.75, 24), 5);

  const labelInterval = Math.max(1, Math.floor(n / 7));
  const showLabel = (i: number) => i === 0 || i === n - 1 || i % labelInterval === 0;

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="flex items-center justify-between mb-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span>Warmer than baseline (+{unit})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-500 inline-block" />
            <span>Cooler than baseline (-{unit})</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">{baselineLabel}</span>
      </div>

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        {/* Upper bound line */}
        <line
          x1={padding.left}
          y1={getY(bound)}
          x2={viewBoxWidth - padding.right}
          y2={getY(bound)}
          stroke="#f1f5f9"
          strokeDasharray="4 4"
        />
        <text
          x={padding.left - 8}
          y={getY(bound) + 4}
          textAnchor="end"
          className="text-[10px] fill-slate-400 font-medium"
        >
          +{bound}
          {unit}
        </text>

        {/* Lower bound line */}
        <line
          x1={padding.left}
          y1={getY(-bound)}
          x2={viewBoxWidth - padding.right}
          y2={getY(-bound)}
          stroke="#f1f5f9"
          strokeDasharray="4 4"
        />
        <text
          x={padding.left - 8}
          y={getY(-bound) + 4}
          textAnchor="end"
          className="text-[10px] fill-slate-400 font-medium"
        >
          -{bound}
          {unit}
        </text>

        {/* Zero Baseline Line */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={viewBoxWidth - padding.right}
          y2={zeroY}
          stroke="#64748b"
          strokeWidth="1.5"
        />
        <text
          x={padding.left - 8}
          y={zeroY + 4}
          textAnchor="end"
          className="text-[10px] fill-slate-600 font-bold"
        >
          0.0{unit}
        </text>

        {/* Anomaly Bars */}
        {data.map((d, i) => {
          const isPositive = d.anomaly >= 0;
          const yTop = isPositive ? getY(d.anomaly) : zeroY;
          const barHeight = Math.max(Math.abs(getY(d.anomaly) - zeroY), 1.5);
          const x = padding.left + i * slotWidth + (slotWidth - barWidth) / 2;
          const isHovered = hoverIndex === i;

          const barFill = isPositive
            ? d.anomaly > 1.0
              ? '#ef4444' // red
              : '#f97316' // orange
            : '#0284c7'; // sky blue

          return (
            <g key={i}>
              <rect
                x={x}
                y={yTop}
                width={barWidth}
                height={barHeight}
                rx={1.5}
                fill={barFill}
                opacity={isHovered ? 1 : 0.85}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />

              {showLabel(i) && (
                <text
                  x={x + barWidth / 2}
                  y={viewBoxHeight - 10}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {d.year}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute z-10 pointer-events-none rounded-xl bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 text-xs shadow-lg border border-slate-700/80 -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${
              ((padding.left +
                hoverIndex * slotWidth +
                slotWidth / 2) /
                viewBoxWidth) *
              100
            }%`,
            top: `${(padding.top / viewBoxHeight) * 100}%`,
          }}
        >
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1">
            Year {data[hoverIndex].year}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-black ${
                data[hoverIndex].anomaly >= 0 ? 'text-rose-400' : 'text-sky-400'
              }`}
            >
              {data[hoverIndex].anomaly > 0 ? '+' : ''}
              {data[hoverIndex].anomaly}
              {unit}
            </span>
            <span className="text-[10px] text-slate-300">
              {data[hoverIndex].anomaly >= 0 ? 'above baseline' : 'below baseline'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
