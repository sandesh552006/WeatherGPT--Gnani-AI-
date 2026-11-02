'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { GeoLocation, WeatherMapLayer, MapRiskSummary } from '@/lib/types';
import { WeatherMap } from './WeatherMap';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName } from '@/lib/i18n/locations';

interface WeatherMapViewProps {
  currentLocation: GeoLocation;
  onOpenChat: (q?: string) => void;
  onLocationChange?: (loc: GeoLocation) => void;
}

export const WeatherMapView: React.FC<WeatherMapViewProps> = ({
  currentLocation,
  onOpenChat,
  onLocationChange,
}) => {
  const { language, t } = useTranslation();
  const [activeLayer, setActiveLayer] = useState<WeatherMapLayer>('rainfall');
  const [hourOffset, setHourOffset] = useState<number>(0);
  const [riskSummary, setRiskSummary] = useState<MapRiskSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather/grid${refresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setRiskSummary(data.riskSummary);
      }
    } catch (e) {
      console.error('Failed to load risk summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const locName = getLocalizedLocationName(currentLocation, language);

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER SECTION                                        */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Compass className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{t.maps.intelligence}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.maps.pageTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.maps.pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSummary(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-50 dark:hover:bg-[#162550] border border-slate-200 dark:border-indigo-500/25 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{loading ? t.common.loading : t.common.refresh}</span>
          </button>

          <button
            onClick={() => onOpenChat(`Give me a national weather map intelligence overview for India right now.`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.nav.askWeatherGPT}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. WEATHER RISK SUMMARY CARDS                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Heavy Rain Areas */}
        <div className="p-4 rounded-3xl glass-card transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="text-base">🌧️</span>
              <span>{t.maps.heavyRainAreas}</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {riskSummary?.heavyRainCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            {riskSummary && riskSummary.heavyRainAreas.length > 0
              ? riskSummary.heavyRainAreas.join(', ')
              : 'None active currently'}
          </p>
        </div>

        {/* Hot Areas */}
        <div className="p-4 rounded-3xl glass-card transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="text-base">🌡️</span>
              <span>{t.maps.hotAreas}</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {riskSummary?.hotAreaCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            {riskSummary && riskSummary.hotAreas.length > 0
              ? riskSummary.hotAreas.join(', ')
              : 'None exceeding 35°C'}
          </p>
        </div>

        {/* Strong Wind Areas */}
        <div className="p-4 rounded-3xl glass-card transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="text-base">💨</span>
              <span>{t.maps.strongWindAreas}</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {riskSummary?.strongWindCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            {riskSummary && riskSummary.strongWindAreas.length > 0
              ? riskSummary.strongWindAreas.join(', ')
              : 'Calm across monitored grid'}
          </p>
        </div>

        {/* Active Grid Coverage */}
        <div className="p-4 rounded-3xl glass-card transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="text-base">📍</span>
              <span>{t.maps.monitoredRegions}</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {riskSummary?.totalPoints ?? 24}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Full synoptic Indian coverage
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE WEATHER MAP ENGINE (Full Mode)            */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-3.5 sm:p-6 shadow-sm">
        <WeatherMap
          mode="full"
          currentLocation={currentLocation}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          onOpenChat={onOpenChat}
          onLocationChange={onLocationChange}
          selectedHourOffset={hourOffset}
          onHourOffsetChange={setHourOffset}
          heightClass="h-[360px] sm:h-[460px] lg:h-[540px]"
        />
      </div>

      {/* ======================================================== */}
      {/* 4. RAIN ALERT ZONES NOTICE & INSIGHTS FOOTER             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notice */}
        <div className="rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 p-5 flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              {t.maps.noticeTitle}
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {t.maps.noticeDesc}
            </p>
          </div>
        </div>

        {/* Quick Location Intelligence */}
        <div className="rounded-3xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                {t.maps.focusedLocation}: {locName}
              </h4>
            </div>
            <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
              {t.maps.clickMapPrompt}
            </p>
          </div>

          <button
            onClick={() => onOpenChat(`What is the meteorological map radar overview for ${locName}?`)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold whitespace-nowrap shadow-md shadow-indigo-600/20 transition-all"
          >
            {t.nav.askWeatherGPT}
          </button>
        </div>
      </div>
    </div>
  );
};
