'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { WeatherMapProps } from './WeatherMapInner';

const WeatherMapDynamic = dynamic(() => import('./WeatherMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 flex flex-col items-center justify-center text-slate-500 gap-3">
      <div className="h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-700">Loading interactive India weather map...</span>
      <span className="text-[10px] text-slate-400">OpenStreetMap & Open-Meteo Engine</span>
    </div>
  ),
});

export const WeatherMap: React.FC<WeatherMapProps> = (props) => {
  return <WeatherMapDynamic {...props} />;
};

export type { WeatherMapProps } from './WeatherMapInner';
