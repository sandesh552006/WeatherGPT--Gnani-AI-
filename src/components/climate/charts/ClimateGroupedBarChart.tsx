'use client';

import React, { useState } from 'react';

export interface GroupedCategory {
  category: string;
  values: {
    [seriesId: string]: number;
  };
}

export interface GroupSeriesMeta {
  id: string;
  name: string;
  color: string;
  unit: string;
}

interface ClimateGroupedBarChartProps {
  categories: GroupedCategory[];
  seriesList: GroupSeriesMeta[];
  height?: number;
}

export const ClimateGroupedBarChart: React.FC<ClimateGroupedBarChartProps> = ({
  categories,
  seriesList,
  height = 260,
}) => {
  const [hoverCategory, setHoverCategory] = useState<number | null>(null);

  if (!categories || categories.length === 0 || !seriesList || seriesList.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl"
      >
        No comparison data available
      </div>
    );
  }

  const numCats = categories.length;
  const numSeries = seriesList.length;

  // Global max across all categories and series
  let maxVal = 1;
  categories.forEach((cat) => {
    seriesList.forEach((s) => {
      const v = cat.values[s.id] || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  const chartMaxY = Math.ceil(maxVal * 1.15);

  const viewBoxWidth = 800;
  const viewBoxHeight = height;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };

  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  const catSlotWidth = plotWidth / numCats;
  const totalBarGroupWidth = catSlotWidth * 0.75;
  const barWidth = Math.max(Math.min(totalBarGroupWidth / numSeries - 2, 28), 6);

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

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs font-semibold text-slate-600">
        {seriesList.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

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
              </text>
            </g>
          );
        })}

        {/* Categories & Grouped Bars */}
        {categories.map((cat, catIdx) => {
          const groupStartX =
            padding.left +
            catIdx * catSlotWidth +
            (catSlotWidth - numSeries * (barWidth + 2)) / 2;
          const isHovered = hoverCategory === catIdx;

          return (
            <g
              key={catIdx}
              onMouseEnter={() => setHoverCategory(catIdx)}
              onMouseLeave={() => setHoverCategory(null)}
              className="cursor-pointer"
            >
              {/* Category label */}
              <text
                x={padding.left + catIdx * catSlotWidth + catSlotWidth / 2}
                y={viewBoxHeight - 12}
                textAnchor="middle"
                className={`text-[11px] font-medium ${
                  isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500'
                }`}
              >
                {cat.category}
              </text>

              {/* Each series bar inside category */}
              {seriesList.map((s, sIdx) => {
                const val = cat.values[s.id] || 0;
                const barHeight = Math.max((val / chartMaxY) * plotHeight, 2);
                const x = groupStartX + sIdx * (barWidth + 2);
                const y = padding.top + plotHeight - barHeight;

                return (
                  <rect
                    key={s.id}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={2}
                    fill={s.color}
                    opacity={isHovered ? 1 : 0.85}
                    className="transition-all duration-150"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoverCategory !== null && categories[hoverCategory] && (
        <div
          className="absolute z-10 pointer-events-none rounded-xl bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 text-xs shadow-lg border border-slate-700/80 -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${
              ((padding.left +
                hoverCategory * catSlotWidth +
                catSlotWidth / 2) /
                viewBoxWidth) *
              100
            }%`,
            top: `${(padding.top / viewBoxHeight) * 100}%`,
          }}
        >
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1">
            {categories[hoverCategory].category}
          </div>
          <div className="space-y-1">
            {seriesList.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-sm inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}:
                </span>
                <span className="font-bold text-white">
                  {categories[hoverCategory].values[s.id] ?? 0} {s.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
