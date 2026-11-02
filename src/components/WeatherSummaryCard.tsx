'use client';

import React from 'react';
import { WeatherSummaryCardData } from '@/lib/types';
import { MapPin, Droplets, Wind, CloudRain } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName, getLocalizedCountry } from '@/lib/i18n/locations';

interface WeatherSummaryCardProps {
  data: WeatherSummaryCardData;
}

export const WeatherSummaryCard: React.FC<WeatherSummaryCardProps> = ({ data }) => {
  const { language, t, translateCondition } = useTranslation();

  return (
    <div className="my-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e1834] via-[#0f1d40] to-[#0a1226] p-4 text-white shadow-xl transition-all hover:shadow-2xl border border-indigo-500/25 max-w-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
            <span>{getLocalizedLocationName(data.locationName, language)}</span>
          </div>
          {data.country && (
            <p className="text-[11px] text-slate-400 ml-5">{getLocalizedCountry(data.country, language)}</p>
          )}
        </div>
        <span className="text-3xl filter drop-shadow" role="img" aria-label={data.conditionText}>
          {data.conditionIcon || '🌤️'}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-3xl font-extrabold tracking-tight">{data.temperature}°C</span>
        <div>
          <p className="text-sm font-semibold text-slate-100">{translateCondition(data.conditionText)}</p>
          <p className="text-[11px] text-slate-400">{t.weather.feelsLike} {data.feelsLike}°C</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-center">
        <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Droplets className="h-3 w-3 text-sky-400" />
            <span>{t.weather.humidity}</span>
          </div>
          <span className="text-xs font-bold text-slate-100 mt-0.5">{data.humidity}%</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Wind className="h-3 w-3 text-cyan-400" />
            <span>{t.weather.wind}</span>
          </div>
          <span className="text-xs font-bold text-slate-100 mt-0.5">{data.windSpeed} km/h</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <CloudRain className="h-3 w-3 text-indigo-400" />
            <span>{t.weather.rainProbability}</span>
          </div>
          <span className="text-xs font-bold text-slate-100 mt-0.5">{data.rainProbability}%</span>
        </div>
      </div>
    </div>
  );
};
