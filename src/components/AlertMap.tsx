'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { WeatherAlert } from '@/lib/alertTypes';
import { GeoLocation } from '@/lib/types';

interface AlertMapProps {
  alerts: WeatherAlert[];
  currentLocation: GeoLocation;
  onSelectAlert: (alert: WeatherAlert) => void;
  onOpenChat: (q?: string) => void;
  heightClass?: string;
}

const AlertMapDynamic = dynamic(() => import('./AlertMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-2.5">
      <div className="h-6 w-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-700">Loading India Weather Alert Map...</span>
      <span className="text-[10px] text-slate-400">Official IMD & NDMA Common Alerting Protocol</span>
    </div>
  ),
});

export const AlertMap: React.FC<AlertMapProps> = (props) => {
  return <AlertMapDynamic {...props} />;
};
