'use client';

import React, { useState } from 'react';
import { Clock, Info } from 'lucide-react';
import { OperationalHourSlot } from '@/lib/sectoral/types';

interface AdvisoryTimelineProps {
  timeline: OperationalHourSlot[];
  sectorName: string;
}

export const AdvisoryTimeline: React.FC<AdvisoryTimelineProps> = ({
  timeline,
  sectorName,
}) => {
  const [hoverSlot, setHoverSlot] = useState<OperationalHourSlot | null>(null);

  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <h4 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
            24-Hour Operational Suitability Ribbon
          </h4>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Optimal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
            Caution
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            High Risk
          </span>
        </div>
      </div>

      {/* 24-Hour Blocks Ribbon */}
      <div className="relative overflow-x-auto">
        <div className="grid grid-cols-12 md:grid-cols-24 gap-1 py-1 min-w-[280px]">
          {timeline.slice(0, 24).map((slot, idx) => {
            const isHovered = hoverSlot?.hourIndex === slot.hourIndex;
            const bgClass =
              slot.status === 'good'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : slot.status === 'caution'
                ? 'bg-amber-400 hover:bg-amber-500'
                : 'bg-rose-500 hover:bg-rose-600';

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoverSlot(slot)}
                onMouseLeave={() => setHoverSlot(null)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div
                  className={`w-full h-7 rounded-md transition-all duration-150 ${bgClass} ${
                    isHovered ? 'ring-2 ring-blue-600 scale-105 z-10' : ''
                  }`}
                />
                <span className="text-[9px] font-medium text-slate-400 mt-1 hidden sm:block">
                  {idx % 3 === 0 ? slot.hourLabel.replace(':00', '') : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Floating Tooltip */}
        {hoverSlot && (
          <div className="p-3 rounded-2xl bg-slate-900/95 text-white text-xs shadow-xl border border-slate-700/80 mt-2 max-w-xs space-y-1">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-slate-200">{hoverSlot.hourLabel}</span>
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  hoverSlot.status === 'good'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : hoverSlot.status === 'caution'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {hoverSlot.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 pt-1">
              <div>🌡️ {hoverSlot.temp}°C</div>
              <div>🌧️ {hoverSlot.rainProb}%</div>
              <div>💨 {hoverSlot.windKmH} km/h</div>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">{hoverSlot.reason}</p>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100">
        <span>Evaluated from Open-Meteo hourly NWP forecast stream</span>
        <span className="font-medium text-slate-600">{sectorName} Operations</span>
      </div>
    </div>
  );
};
