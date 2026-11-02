'use client';

import React, { useState } from 'react';

export interface LineSeries {
  id: string;
  name: string;
  color: string;
  strokeDash?: string;
  data: Array<{ x: number | string; y: number }>;
}

interface ClimateLineChartProps {
  series: LineSeries[];
  unit: string;
  height?: number;
  showTrendline?: boolean;
  trendlineSlope?: number;
  trendlineIntercept?: number;
}

export const ClimateLineChart: React.FC<ClimateLineChartProps> = ({
  series,
  unit,
  height = 240,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!series || series.length === 0 || !series[0]?.data?.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl"
      >
        No chart data available
      </div>
    );
  }

  const primaryData = series[0].data;
  const n = primaryData.length;

  // Calculate global min & max Y across all series
  let minY = Infinity;
  let maxY = -Infinity;

  series.forEach((s) => {
    s.data.forEach((d) => {
      if (typeof d.y === 'number' && !isNaN(d.y)) {
        if (d.y < minY) minY = d.y;
        if (d.y > maxY) maxY = d.y;
      }
    });
  });

  if (minY === Infinity || maxY === -Infinity) {
    minY = 0;
    maxY = 10;
  }

  // Add 10% padding to bounds
  const range = Math.max(maxY - minY, 2);
  const chartMinY = Math.floor(minY - range * 0.1);
  const chartMaxY = Math.ceil(maxY + range * 0.1);
  const ySpan = chartMaxY - chartMinY;

  const viewBoxWidth = 800;
  const viewBoxHeight = height;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / Math.max(n - 1, 1)) * plotWidth;
  const getY = (val: number) => {
    const norm = (val - chartMinY) / ySpan;
    return padding.top + plotHeight - norm * plotHeight;
  };

  // Y-axis ticks (4 ticks)
  const yTicks = [
    chartMinY,
    Number((chartMinY + ySpan * 0.33).toFixed(1)),
    Number((chartMinY + ySpan * 0.66).toFixed(1)),
    chartMaxY,
  ];

  // X-axis ticks (up to 7 ticks spaced out)
  const xTickInterval = Math.max(1, Math.floor(n / 6));
  const xIndices: number[] = [];
  for (let i = 0; i < n; i += xTickInterval) {
    xIndices.push(i);
  }
  if (xIndices[xIndices.length - 1] !== n - 1) {
    xIndices.push(n - 1);
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative min-w-[500px] w-full select-none">
        {/* Legend */}
      {series.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs font-semibold text-slate-600">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {yTicks.map((tick, idx) => {
          const yPos = getY(tick);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={yPos}
                x2={viewBoxWidth - padding.right}
                y2={yPos}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={yPos + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {tick}
                {unit}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {xIndices.map((idx) => {
          const item = primaryData[idx];
          if (!item) return null;
          const xPos = getX(idx);
          return (
            <text
              key={idx}
              x={xPos}
              y={viewBoxHeight - 10}
              textAnchor="middle"
              className="text-[11px] fill-slate-400 font-medium"
            >
              {item.x}
            </text>
          );
        })}

        {/* Area fill for primary series */}
        {series.length === 1 && (
          <path
            d={`
              ${primaryData.reduce(
                (acc, curr, i) =>
                  i === 0 ? `M ${getX(i)},${getY(curr.y)}` : `${acc} L ${getX(i)},${getY(curr.y)}`,
                ''
              )}
              L ${getX(n - 1)},${padding.top + plotHeight}
              L ${getX(0)},${padding.top + plotHeight} Z
            `}
            fill="url(#lineGrad)"
          />
        )}

        {/* Series Line Paths */}
        {series.map((s) => {
          const pathD = s.data.reduce(
            (acc, curr, i) =>
              i === 0 ? `M ${getX(i)},${getY(curr.y)}` : `${acc} L ${getX(i)},${getY(curr.y)}`,
            ''
          );
          return (
            <path
              key={s.id}
              d={pathD}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeDasharray={s.strokeDash}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Interactive Hover Vertical Rule */}
        {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={padding.top + plotHeight}
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {series.map((s) => {
              const pt = s.data[hoverIndex];
              if (!pt) return null;
              return (
                <circle
                  key={s.id}
                  cx={getX(hoverIndex)}
                  cy={getY(pt.y)}
                  r="5"
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="3"
                />
              );
            })}
          </g>
        )}

        {/* Transparent overlay for hover detection */}
        {primaryData.map((_, i) => {
          const xPos = getX(i);
          const barW = plotWidth / Math.max(n, 1);
          return (
            <rect
              key={i}
              x={xPos - barW / 2}
              y={padding.top}
              width={barW}
              height={plotHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && primaryData[hoverIndex] && (
        <div
          className="absolute z-10 pointer-events-none rounded-xl bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 text-xs shadow-lg border border-slate-700/80 -translate-x-1/2 -translate-y-full mb-2 transition-all duration-75"
          style={{
            left: `${(getX(hoverIndex) / viewBoxWidth) * 100}%`,
            top: `${(padding.top / viewBoxHeight) * 100}%`,
          }}
        >
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1">
            {primaryData[hoverIndex].x}
          </div>
          <div className="space-y-0.5">
            {series.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}:
                </span>
                <span className="font-bold text-white">
                  {s.data[hoverIndex]?.y}
                  {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
