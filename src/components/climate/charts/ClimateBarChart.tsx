'use client';

import React, { useState } from 'react';

export interface BarDatum {
  label: string | number;
  value: number;
  secondaryLabel?: string;
  color?: string;
}

interface ClimateBarChartProps {
  data: BarDatum[];
  unit: string;
  defaultColor?: string;
  height?: number;
  showAverageLine?: boolean;
  onBarClick?: (datum: BarDatum) => void;
}

export const ClimateBarChart: React.FC<ClimateBarChartProps> = ({
  data,
  unit,
  defaultColor = '#3b82f6',
  height = 240,
  showAverageLine = true,
  onBarClick,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl"
      >
        No chart data available
      </div>
    );
  }

  const n = data.length;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartMaxY = Math.ceil(maxVal * 1.15);

  const avgVal =
    data.length > 0
      ? Number((data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1))
      : 0;

  const viewBoxWidth = 800;
  const viewBoxHeight = height;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  const slotWidth = plotWidth / n;
  const barWidth = Math.max(Math.min(slotWidth * 0.75, 28), 6);

  const getY = (val: number) => {
    const norm = Math.max(val, 0) / chartMaxY;
    return padding.top + plotHeight - norm * plotHeight;
  };

  const yTicks = [
    0,
    Math.round(chartMaxY * 0.33),
    Math.round(chartMaxY * 0.66),
    chartMaxY,
  ];

  // X-axis label sampling
  const labelInterval = Math.max(1, Math.floor(n / 7));
  const showLabel = (i: number) => i === 0 || i === n - 1 || i % labelInterval === 0;

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative min-w-[500px] w-full select-none">
        <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        {/* Y Gridlines */}
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

        {/* Average reference line */}
        {showAverageLine && avgVal > 0 && (
          <g>
            <line
              x1={padding.left}
              y1={getY(avgVal)}
              x2={viewBoxWidth - padding.right}
              y2={getY(avgVal)}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <text
              x={viewBoxWidth - padding.right}
              y={getY(avgVal) - 6}
              textAnchor="end"
              className="text-[10px] fill-amber-600 font-bold"
            >
              Avg: {avgVal} {unit}
            </text>
          </g>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / chartMaxY) * plotHeight, 2);
          const x = padding.left + i * slotWidth + (slotWidth - barWidth) / 2;
          const y = padding.top + plotHeight - barHeight;
          const isHovered = hoverIndex === i;
          const barColor = d.color || defaultColor;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth > 10 ? 3 : 1.5}
                fill={barColor}
                opacity={isHovered ? 1 : 0.85}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => onBarClick && onBarClick(d)}
              />

              {/* X-axis tick label */}
              {showLabel(i) && (
                <text
                  x={x + barWidth / 2}
                  y={viewBoxHeight - 10}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {d.label}
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
            {data[hoverIndex].label}
          </div>
          <div className="flex items-center gap-2 text-white font-bold">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: data[hoverIndex].color || defaultColor }}
            />
            <span>
              {data[hoverIndex].value} {unit}
            </span>
          </div>
          {data[hoverIndex].secondaryLabel && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              {data[hoverIndex].secondaryLabel}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
