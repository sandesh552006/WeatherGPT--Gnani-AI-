'use client';

import React from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Sun,
  Eye,
  Radio,
  Sparkles,
} from 'lucide-react';
import { WeatherFactorItem } from '@/lib/sectoral/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface WeatherFactorsPanelProps {
  factors: WeatherFactorItem[];
  dopplerStatus: {
    title: string;
    description: string;
    isAlertActive: boolean;
  };
  locationName: string;
}

export const WeatherFactorsPanel: React.FC<WeatherFactorsPanelProps> = ({
  factors,
  dopplerStatus,
  locationName,
}) => {
  const { t } = useTranslation();
  const getFactorIcon = (id: string) => {
    switch (id) {
      case 'temp':
        return <Thermometer className="h-4 w-4 text-amber-500" />;
      case 'humidity':
        return <Droplets className="h-4 w-4 text-sky-400" />;
      case 'rain_prob':
        return <CloudRain className="h-4 w-4 text-indigo-400" />;
      case 'wind':
        return <Wind className="h-4 w-4 text-teal-400" />;
      case 'uv':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'visibility':
        return <Eye className="h-4 w-4 text-slate-400" />;
      case 'precip_24h':
        return <CloudRain className="h-4 w-4 text-indigo-400" />;
      default:
        return <Thermometer className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-3xl glass-card p-4 sm:p-6 space-y-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {t.sectoral.weatherFactors}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Deterministic parameter drivers
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            Open-Meteo & IMD Live
          </span>
        </div>

        {/* Factors List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mt-1">
          {factors.map((factor) => (
            <div key={factor.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-slate-50 dark:bg-[#070b19] border border-slate-100 dark:border-indigo-500/20">
                  {getFactorIcon(factor.id)}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 block">{factor.name}</span>
                  {factor.comparisonNote && (
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {factor.comparisonNote}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{factor.value}</span>
                {factor.statusLabel && (
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      factor.statusColor || 'text-slate-600 bg-slate-100'
                    }`}
                  >
                    {factor.statusLabel}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doppler Weather Radar Live Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1c3e] to-[#070e22] text-white space-y-2 border border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              {dopplerStatus.title}
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
            IMD DWR Grid
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          {dopplerStatus.description}
        </p>
      </div>
    </div>
  );
};
