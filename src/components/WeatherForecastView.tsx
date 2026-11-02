'use client';

import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Droplets,
  Wind,
  Compass,
  CloudRain,
  Sun,
  Sunrise,
  Sunset,
  Gauge,
  Eye,
  Thermometer,
  ShieldAlert,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Info,
  Calendar,
  Clock,
  Umbrella,
} from 'lucide-react';
import { WeatherData, GeoLocation } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName, getLocalizedCountry } from '@/lib/i18n/locations';
import { getLanguageLocale } from '@/lib/i18n/types';

interface WeatherForecastViewProps {
  weather: WeatherData | null;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenChat: (q?: string) => void;
  currentLocation?: GeoLocation;
}

export const WeatherForecastView: React.FC<WeatherForecastViewProps> = ({
  weather,
  loading = false,
  onRefresh,
  onOpenChat,
  currentLocation,
}) => {
  const { language, t, translateCondition } = useTranslation();
  const [activeHoverHour, setActiveHoverHour] = useState<number | null>(null);

  const locName = getLocalizedLocationName(weather?.location || currentLocation, language);
  const country = getLocalizedCountry(weather?.location?.country || currentLocation?.country, language);

  const now = new Date();
  const locale = getLanguageLocale(language);
  const dateFormatted = now.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const hourlyList = weather?.hourly24h || [];
  const dailyList = weather?.daily || [];
  const current = weather?.current;
  const analysis = weather?.analysis24h;

  // Temperature trend values for SVG chart
  const temps = hourlyList.map((h) => h.temperature);
  const minTemp = temps.length > 0 ? Math.min(...temps) : 20;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 35;
  const tempRange = Math.max(maxTemp - minTemp, 4);

  // Precipitation values
  const rainProbs = hourlyList.map((h) => h.precipitationProbability);
  const precipAmounts = hourlyList.map((h) => h.precipitation);

  // SVG Chart Geometry
  const chartWidth = 720;
  const chartHeight = 160;
  const chartPadding = { top: 24, bottom: 28, left: 16, right: 16 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const points = hourlyList.map((item, index) => {
    const x = chartPadding.left + (index / Math.max(hourlyList.length - 1, 1)) * innerWidth;
    const norm = (item.temperature - minTemp) / tempRange;
    const y = chartPadding.top + innerHeight - norm * innerHeight;
    return { x, y, item, index };
  });

  const linePath = points.length > 0
    ? points.reduce((acc, curr, i) => (i === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`), '')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${chartHeight - chartPadding.bottom} L ${points[0].x},${chartHeight - chartPadding.bottom} Z`
    : '';

  // Rule-based Weather Insights generator
  const generateInsights = () => {
    const insights: Array<{ title: string; desc: string; icon: string; badge: string; color: string }> = [];

    // 1. Rain Insight
    if (analysis?.willRain && analysis.peakRainProbability >= 50) {
      insights.push({
        title: 'Rain Probability High',
        desc: `Heavy rain is likely around ${analysis.peakRainWindow} (peak chance ${analysis.peakRainProbability}%). Carry an umbrella today.`,
        icon: '🌧️',
        badge: 'Precipitation Alert',
        color: 'border-blue-200 bg-blue-50/70 text-blue-900',
      });
    } else if (analysis?.peakRainProbability && analysis.peakRainProbability > 20) {
      insights.push({
        title: 'Light Showers Possible',
        desc: `Passing showers possible around ${analysis.peakRainWindow} (${analysis.peakRainProbability}% chance). Total expected rain is under 1 mm.`,
        icon: '🌦️',
        badge: 'Shower Chance',
        color: 'border-sky-200 bg-sky-50/70 text-sky-900',
      });
    } else {
      insights.push({
        title: 'Dry & Clear Outlook',
        desc: 'Negligible chance of rainfall across the next 24 hours. Ideal for outdoor activities and travel.',
        icon: '☀️',
        badge: 'Clear Conditions',
        color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
      });
    }

    // 2. Temperature Peak Insight
    if (analysis?.hottestHour) {
      insights.push({
        title: 'Temperature Peak',
        desc: `Temperatures will peak at ${analysis.tempMax24h}°C around ${analysis.hottestHour}. Low will be ${analysis.tempMin24h}°C around ${analysis.coldestHour}.`,
        icon: '🌡️',
        badge: 'Thermal Trend',
        color: 'border-amber-200 bg-amber-50/70 text-amber-900',
      });
    }

    // 3. Wind & Comfort Insight
    if (analysis && analysis.maxWindSpeedKmH >= 25) {
      insights.push({
        title: 'Breezy to Gusty Winds',
        desc: `Wind speeds expected to reach up to ${analysis.maxWindSpeedKmH} km/h. Secure loose outdoor fixtures.`,
        icon: '💨',
        badge: 'Wind Advisory',
        color: 'border-teal-200 bg-teal-50/70 text-teal-900',
      });
    } else {
      insights.push({
        title: 'Gentle Breeze',
        desc: `Calm to moderate winds (${current?.windSpeed ?? 10} km/h). Good dispersion and pleasant atmospheric flow.`,
        icon: '🍃',
        badge: 'Wind Comfort',
        color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
      });
    }

    // 4. UV Index Insight
    const currentUV = current?.uvIndex ?? (hourlyList[0]?.uvIndex ?? 5);
    if (currentUV >= 8) {
      insights.push({
        title: 'Very High UV Exposure',
        desc: `UV Index reaches ${currentUV} during peak afternoon hours. Use SPF 30+ sunscreen and wear sunglasses.`,
        icon: '🕶️',
        badge: 'Sun Protection',
        color: 'border-rose-200 bg-rose-50/70 text-rose-900',
      });
    } else {
      insights.push({
        title: 'Moderate UV Index',
        desc: `UV Index is rated at ${currentUV}. Safe for moderate sun exposure, stay hydrated throughout the afternoon.`,
        icon: '🧴',
        badge: 'UV Index',
        color: 'border-slate-200 bg-slate-50/80 text-slate-800',
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* ======================================================== */}
      {/* A. LOCATION HEADER                                        */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0e1c3e] via-[#0b1633] to-[#070e22] text-white p-4 sm:p-7 shadow-2xl border border-indigo-500/25 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Location details & current temperature */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <MapPin className="h-4 w-4 text-rose-400 fill-rose-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {locName}, <span className="text-slate-300 font-semibold">{country}</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{dateFormatted}</span>
                  <span>•</span>
                  <span>{t.dashboard.updatedAt} {timeFormatted}</span>
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                {current?.temperature ?? 30}°C
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{current?.conditionIcon || '🌤️'}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-100">
                    {translateCondition(current?.conditionText || 'Partly Cloudy')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.weather.feelsLike} <span className="text-white font-semibold">{current?.feelsLike ?? 32}°C</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & Ask WeatherGPT */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-200 transition-all backdrop-blur-md"
                  title="Refresh live Open-Meteo forecast"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>{loading ? t.common.loading : t.common.refresh}</span>
                </button>
              )}

              <button
                onClick={() => onOpenChat(`What is the complete weather forecast for ${locName}?`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.nav.askWeatherGPT}</span>
              </button>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Open-Meteo & IMD Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* B. TODAY'S WEATHER SUMMARY (12 key metrics)              */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{t.forecast.summaryTitle}</h2>
          </div>
          <span className="text-xs text-slate-400">Comprehensive Meteorological Parameters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Temp & Feels like */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:border-slate-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 mb-1.5">
              <Thermometer className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.weather.feelsLike}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{current?.feelsLike ?? 32}°C</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{current?.temperature ?? 30}°C</div>
          </div>

          {/* 2. Humidity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:border-slate-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 text-sky-500 mb-1.5">
              <Droplets className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.weather.humidity}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{current?.humidity ?? 70}%</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {(current?.humidity ?? 70) > 75 ? 'Humid' : (current?.humidity ?? 70) < 40 ? 'Dry' : 'Comfortable'}
            </div>
          </div>

          {/* 3. Wind Speed & Direction */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:border-slate-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 text-cyan-500 mb-1.5">
              <Wind className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.weather.wind}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{current?.windSpeed ?? 12} km/h</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Compass className="h-3 w-3" />
              <span>{current?.windDirection ?? 180}° (Gusts {current?.windGusts ?? 15} km/h)</span>
            </div>
          </div>

          {/* 4. Rain Probability */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:border-slate-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
              <CloudRain className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.weather.rainProbability}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {analysis?.peakRainProbability ?? 15}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {current?.precipitation ?? 0} mm
            </div>
          </div>

          {/* 5. UV Index */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:border-slate-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 text-amber-500 mb-1.5">
              <Sun className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.weather.uvIndex}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {current?.uvIndex ?? (hourlyList[0]?.uvIndex ?? 5)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {(current?.uvIndex ?? 5) >= 8 ? 'Very High' : (current?.uvIndex ?? 5) >= 6 ? 'High' : 'Moderate'}
            </div>
          </div>

          {/* 6. Visibility & Pressure */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:border-slate-200 dark:hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 text-purple-400 mb-1.5">
              <Gauge className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.weather.pressure}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{current?.pressure ?? 1012} hPa</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.weather.visibility}: {current?.visibility ?? 6} km</div>
          </div>
        </div>

        {/* Sunrise & Sunset ribbon */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
                <Sunrise className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.weather.sunrise}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{current?.sunrise || '06:05 AM'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800">
                <Sunset className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.weather.sunset}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{current?.sunset || '06:38 PM'}</span>
              </div>
            </div>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-indigo-400" />
            <span>24h Min: <strong className="text-slate-700 dark:text-slate-200">{analysis?.tempMin24h ?? 24}°C</strong> | 24h Max: <strong className="text-slate-700 dark:text-slate-200">{analysis?.tempMax24h ?? 34}°C</strong></span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* C. HOURLY FORECAST (Next 24 Hours)                        */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{t.forecast.hourlyTitle}</h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">{t.forecast.hourlyScrollHint}</span>
        </div>

        <div className="overflow-x-auto pb-3 -mx-2 px-2 scrollbar-thin">
          <div className="flex gap-3 min-w-[900px]">
            {hourlyList.map((slot, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[85px] p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                    isFirst
                      ? 'bg-blue-50/80 dark:bg-indigo-950/60 border-2 border-blue-400/80 dark:border-indigo-500/80 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-[#070b19]/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-indigo-500/15'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {isFirst ? t.weather.now : slot.hourLabel}
                  </span>

                  <span className="text-2xl my-2">{slot.conditionIcon}</span>

                  <span className="text-base font-black text-slate-900 dark:text-white">{slot.temperature}°C</span>

                  <div className="mt-2 w-full pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600 dark:text-indigo-400 font-bold">
                      <CloudRain className="h-3 w-3" />
                      <span>{slot.precipitationProbability}%</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {slot.precipitation > 0 ? `${slot.precipitation} mm` : '0 mm'}
                    </div>
                    <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                      <Wind className="h-2.5 w-2.5" />
                      <span>{slot.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* D & E. 7-DAY FORECAST & TEMPERATURE TREND DUAL GRID       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* D. 7-Day Forecast (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-card p-4 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{t.forecast.dailyTitle}</h2>
              </div>
              <span className="text-[11px] text-slate-400">{t.forecast.minMax}</span>
            </div>

            <div className="space-y-2.5">
              {dailyList.map((day, idx) => {
                const isToday = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                      isToday
                        ? 'bg-blue-50/70 dark:bg-indigo-950/60 border border-blue-200 dark:border-indigo-500/40 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-[#070b19]/60 border border-slate-100 dark:border-indigo-500/15 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-24">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {isToday ? t.weather.today : day.dayLabel}
                        </span>
                        {isToday && (
                          <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                            {t.weather.now}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {day.formattedDate.split(', ')[1] || day.formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl">{day.conditionIcon}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 hidden sm:inline max-w-[90px] truncate">
                        {translateCondition(day.conditionText)}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs text-slate-400 font-semibold">{day.tempMin}°</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-amber-500 rounded-full"
                            style={{
                              width: '100%',
                            }}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">{day.tempMax}°</span>
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-indigo-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
                        <CloudRain className="h-2.5 w-2.5" />
                        <span>{day.precipitationProbabilityMax}% rain</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t.forecast.poweredBy}</span>
            <button
              onClick={() => onOpenChat(`Give me a detailed 7-day weather outlook for ${locName}`)}
              className="text-blue-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {t.nav.askWeatherGPT}
            </button>
          </div>
        </div>

        {/* E & F. CHARTS: TEMPERATURE TREND & PRECIPITATION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* E. Temperature Trend SVG Chart */}
          <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-rose-500" />
                  {t.forecast.temperatureTrend}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.forecast.thermalCurveHint}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                Range: {minTemp}° – {maxTemp}°C
              </span>
            </div>

            {/* Responsive SVG Chart */}
            <div className="w-full overflow-x-auto pb-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full min-w-[500px] h-44 select-none overflow-visible"
              >
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line
                  x1={chartPadding.left}
                  y1={chartPadding.top}
                  x2={chartWidth - chartPadding.right}
                  y2={chartPadding.top}
                  stroke="rgba(129, 140, 248, 0.15)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={chartPadding.left}
                  y1={chartPadding.top + innerHeight / 2}
                  x2={chartWidth - chartPadding.right}
                  y2={chartPadding.top + innerHeight / 2}
                  stroke="rgba(129, 140, 248, 0.15)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={chartPadding.left}
                  y1={chartHeight - chartPadding.bottom}
                  x2={chartWidth - chartPadding.right}
                  y2={chartHeight - chartPadding.bottom}
                  stroke="rgba(129, 140, 248, 0.25)"
                />

                {/* Area under curve */}
                {areaPath && <path d={areaPath} fill="url(#tempGradient)" />}

                {/* Line Path */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points on curve */}
                {points.map((pt, i) => {
                  const isHovered = activeHoverHour === i;
                  const isMin = pt.item.temperature === minTemp;
                  const isMax = pt.item.temperature === maxTemp;
                  const showLabel = i % 3 === 0 || isMin || isMax || isHovered;

                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveHoverHour(i)}
                      onMouseLeave={() => setActiveHoverHour(null)}
                    >
                      {/* Point dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : isMin || isMax ? 4.5 : 3}
                        fill={isMax ? '#ef4444' : isMin ? '#0ea5e9' : '#2563eb'}
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />

                      {/* Temperature label above */}
                      {showLabel && (
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill={isMax ? '#dc2626' : isMin ? '#0284c7' : '#1e293b'}
                        >
                          {pt.item.temperature}°
                        </text>
                      )}

                      {/* Hour label below */}
                      {i % 4 === 0 && (
                        <text
                          x={pt.x}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#94a3b8"
                          fontWeight="500"
                        >
                          {pt.item.hourLabel}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* F. Precipitation / Rain Chart */}
          <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-indigo-400" />
                  {t.forecast.precipitationChart}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hourly rain probability (0–100%) and expected precipitation volume (mm)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-500 font-semibold">
                  <span className="h-2.5 w-2.5 rounded bg-indigo-500" /> {t.forecast.chanceLabel} (%)
                </span>
                <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                  <span className="h-2.5 w-2.5 rounded bg-sky-400" /> {t.forecast.precipLabel} (mm)
                </span>
              </div>
            </div>

            {/* Dual Bar / Indicator Visual */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 min-w-[680px] h-32 items-end pt-4 border-b border-slate-100 dark:border-slate-800">
                {hourlyList.slice(0, 16).map((item, idx) => {
                  const prob = item.precipitationProbability;
                  const precip = item.precipitation;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-10">
                        {item.hourLabel}: {prob}% ({precip} mm)
                      </div>

                      {/* Bar for precipitation probability */}
                      <div className="w-full max-w-[20px] bg-slate-100 dark:bg-slate-800 rounded-t-md flex flex-col justify-end h-24 overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            prob >= 60 ? 'bg-indigo-600' : prob >= 30 ? 'bg-indigo-400' : 'bg-indigo-300 dark:bg-indigo-800'
                          }`}
                          style={{ height: `${Math.max(prob, 4)}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">{prob}%</span>
                      <span className="text-[9px] text-slate-400">{item.hourLabel.replace(' ', '')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* G. WEATHER INSIGHTS (Deterministic rule-based logic)      */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{t.forecast.intelligenceTitle}</h2>
          </div>
          <span className="text-xs text-slate-400">Automated Meteorological Rule Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all hover:shadow-md ${ins.color} dark:bg-[#070b19]/60 dark:border-indigo-500/20`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{ins.icon}</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/80 border border-current/20">
                  {ins.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold tracking-tight mb-1 dark:text-white">{ins.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed dark:text-slate-300">{ins.desc}</p>
            </div>
          ))}
        </div>

        {/* Ask WeatherGPT banner */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-50 dark:from-[#0e1834] dark:via-[#101b3b] dark:to-[#070b19] border border-indigo-200/70 dark:border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              AI
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t.forecast.askQuestionBanner}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.forecast.askQuestionDesc}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChat(`Should I carry an umbrella or prepare for extreme weather in ${locName}?`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 whitespace-nowrap transition-all"
          >
            {t.nav.askWeatherGPT}
          </button>
        </div>
      </div>
    </div>
  );
};
