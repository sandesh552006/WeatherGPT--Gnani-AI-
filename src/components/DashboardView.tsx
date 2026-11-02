'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Droplets,
  Wind,
  Gauge,
  Eye,
  AlertTriangle,
  ArrowRight,
  Send,
  Sparkles,
  RefreshCw,
  Sun,
  CloudRain,
  ChevronDown,
  Compass,
  Maximize2,
  TreePine,
  Building2,
  Sprout,
  Plane,
  Mountain,
  Waves,
  Flame,
  Check,
} from 'lucide-react';
import { WeatherData, GeoLocation, WeatherMapLayer } from '@/lib/types';
import { WeatherAlert, AlertSummaryCounts } from '@/lib/alertTypes';
import { WeatherMap } from './WeatherMap';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLanguageLocale } from '@/lib/i18n/types';
import { getLocalizedLocationName, getLocalizedCountry, getLocalizedAdmin1 } from '@/lib/i18n/locations';
import { GnaniSttButton, GnaniSttState } from './chat/GnaniSttButton';

interface DashboardViewProps {
  weather: WeatherData | null;
  loading: boolean;
  onOpenChat: (initialQuestion?: string) => void;
  onLocationChange: (loc: GeoLocation) => void;
  onRefresh: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToForecast?: () => void;
  onNavigateToMaps?: () => void;
  alerts?: WeatherAlert[];
  summaryCounts?: AlertSummaryCounts;
}

// Explore India's Weather Categories
interface RegionCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  sampleLocation: GeoLocation;
}

const REGION_CATEGORIES: RegionCategory[] = [
  {
    id: 'villages',
    name: 'Villages & Rural',
    icon: TreePine,
    sampleLocation: {
      name: 'Ralegan Siddhi',
      country: 'India',
      country_code: 'IN',
      admin1: 'Maharashtra',
      district: 'Ahmednagar',
      latitude: 19.0305,
      longitude: 74.4534,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: Building2,
    sampleLocation: {
      name: 'Mumbai',
      country: 'India',
      country_code: 'IN',
      admin1: 'Maharashtra',
      district: 'Mumbai City',
      latitude: 19.0760,
      longitude: 72.8777,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'farming',
    name: 'Farming',
    icon: Sprout,
    sampleLocation: {
      name: 'Nashik',
      country: 'India',
      country_code: 'IN',
      admin1: 'Maharashtra',
      district: 'Nashik',
      latitude: 19.9975,
      longitude: 73.7898,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: Plane,
    sampleLocation: {
      name: 'Jaipur',
      country: 'India',
      country_code: 'IN',
      admin1: 'Rajasthan',
      district: 'Jaipur',
      latitude: 26.9124,
      longitude: 75.7873,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'mountains',
    name: 'Mountains',
    icon: Mountain,
    sampleLocation: {
      name: 'Manali',
      country: 'India',
      country_code: 'IN',
      admin1: 'Himachal Pradesh',
      district: 'Kullu',
      latitude: 32.2432,
      longitude: 77.1892,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'beaches',
    name: 'Beaches',
    icon: Waves,
    sampleLocation: {
      name: 'Goa',
      country: 'India',
      country_code: 'IN',
      admin1: 'Goa',
      district: 'North Goa',
      latitude: 15.2993,
      longitude: 74.1240,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'forests',
    name: 'Forests',
    icon: TreePine,
    sampleLocation: {
      name: 'Kaziranga',
      country: 'India',
      country_code: 'IN',
      admin1: 'Assam',
      district: 'Golaghat',
      latitude: 26.5775,
      longitude: 93.1711,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    id: 'deserts',
    name: 'Deserts',
    icon: Flame,
    sampleLocation: {
      name: 'Jaisalmer',
      country: 'India',
      country_code: 'IN',
      admin1: 'Rajasthan',
      district: 'Jaisalmer',
      latitude: 26.9157,
      longitude: 70.9083,
      timezone: 'Asia/Kolkata',
    },
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  weather,
  loading,
  onOpenChat,
  onLocationChange,
  onRefresh,
  onNavigateToAlerts,
  onNavigateToForecast,
  onNavigateToMaps,
  alerts = [],
  summaryCounts,
}) => {
  const { language, t, translateCondition } = useTranslation();
  const [askInput, setAskInput] = useState('');
  const [mapLayer, setMapLayer] = useState<WeatherMapLayer>('temp');
  const [sttStatus, setSttStatus] = useState<{ state: GnaniSttState; message: string }>({
    state: 'idle',
    message: '',
  });

  const now = new Date();
  const locale = getLanguageLocale(language);
  const timeFormatted = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (askInput.trim()) {
      onOpenChat(askInput.trim());
      setAskInput('');
    }
  };

  const promptChips = [
    { emoji: '☁️', text: 'Will it rain today?' },
    { emoji: '✈️', text: 'Is it good for a trip?' },
    { emoji: '👕', text: 'What to wear today?' },
    { emoji: '📷', text: 'Best time to visit?' },
  ];

  // Current weather properties
  const currentTemp = weather?.current.temperature ?? 32;
  const currentFeels = weather?.current.feelsLike ?? 35;
  const currentCondition = weather?.current.conditionText || 'Partly Cloudy';
  const humidity = weather?.current.humidity ?? 58;
  const windSpeed = weather?.current.windSpeed ?? 12;
  const aqiValue = 86; // In a production setup, read from AQI or default pleasant
  const uvValue = 6;

  // Location display strings
  const loc = weather?.location;
  const locPrimary = getLocalizedLocationName(loc, language) || 'New Delhi';
  const locState = getLocalizedAdmin1(loc?.state || loc?.admin1, language);
  const locCountry = getLocalizedCountry(loc?.country, language) || 'India';
  const locSubtitle = [loc?.district || loc?.admin2, locState, locCountry].filter(Boolean).join(', ');

  // Next 6 Hours computed from hourly24h
  const next6Hours = (weather?.hourly24h && weather.hourly24h.length >= 6)
    ? weather.hourly24h.slice(0, 6)
    : [
        { hourLabel: '5 PM', temperature: 31, conditionIcon: '🌤️', precipitationProbability: 0 },
        { hourLabel: '6 PM', temperature: 30, conditionIcon: '🌤️', precipitationProbability: 0 },
        { hourLabel: '7 PM', temperature: 28, conditionIcon: '☁️', precipitationProbability: 10 },
        { hourLabel: '8 PM', temperature: 27, conditionIcon: '🌧️', precipitationProbability: 20 },
        { hourLabel: '9 PM', temperature: 26, conditionIcon: '☁️', precipitationProbability: 20 },
        { hourLabel: '10 PM', temperature: 25, conditionIcon: '🌙', precipitationProbability: 10 },
      ];

  // 5 Day forecast
  const fiveDayList = (weather?.daily && weather.daily.length >= 5)
    ? weather.daily.slice(0, 5)
    : [
        { formattedDate: 'Today', conditionIcon: '🌤️', tempMax: 32, tempMin: 24, conditionText: 'Partly Cloudy' },
        { formattedDate: 'Wed', conditionIcon: '☀️', tempMax: 34, tempMin: 25, conditionText: 'Sunny' },
        { formattedDate: 'Thu', conditionIcon: '🌧️', tempMax: 31, tempMin: 25, conditionText: 'Light Rain' },
        { formattedDate: 'Fri', conditionIcon: '☁️', tempMax: 31, tempMin: 24, conditionText: 'Cloudy' },
        { formattedDate: 'Sat', conditionIcon: '🌤️', tempMax: 33, tempMin: 25, conditionText: 'Partly Cloudy' },
      ];

  return (
    <div className="p-3 sm:p-5 lg:p-7 max-w-[1400px] mx-auto space-y-5">
      {/* ======================================================== */}
      {/* 1. TOP WEATHER HERO CARD                                 */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1c3e] via-[#0b1633] to-[#070e22] text-white p-5 sm:p-7 shadow-2xl border border-indigo-500/25">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between">
          {/* Hero Top Bar: Location Header & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400 fill-indigo-400 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {locPrimary}
                  </h1>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                {locSubtitle && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {locSubtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Badges: Live Weather, Time, Refresh */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Live Weather Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Weather</span>
              </div>

              {/* Time Badge */}
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold backdrop-blur-md">
                {timeFormatted}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh live weather"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition-colors backdrop-blur-md"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Hero Center: Giant Temperature + Dynamic Condition Illustration */}
          <div className="mt-6 sm:mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-md">
                  {currentTemp}°C
                </span>
                <span className="text-lg sm:text-2xl font-bold text-slate-200">
                  {translateCondition(currentCondition)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                <span className="text-slate-400">Feels like <strong className="text-white">{currentFeels}°C</strong></span>
                <span>•</span>
                <span className="text-slate-300 font-medium">
                  Warm and partly cloudy. Pleasant evening ahead.
                </span>
              </div>
            </div>

            {/* Dynamic Sun & 3D Cloud Graphic */}
            <div className="relative w-44 h-32 flex items-center justify-center self-center md:self-auto flex-shrink-0 animate-float">
              <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-2xl">
                <defs>
                  {/* Sun Glow Gradient */}
                  <radialGradient id="sunAura" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
                  </radialGradient>
                  {/* Cloud Surface Gradient */}
                  <linearGradient id="cloudSurface" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#e0e7ff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.75" />
                  </linearGradient>
                </defs>

                {/* Glowing Sun in the background */}
                <circle cx="130" cy="55" r="38" fill="url(#sunAura)" className="filter drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" />

                {/* Foreground 3D Cloud */}
                <path
                  d="M45 110 
                     C 30 110, 20 98, 26 82 
                     C 28 68, 42 62, 54 65 
                     C 60 48, 80 40, 100 48 
                     C 114 40, 134 44, 142 58 
                     C 156 60, 168 72, 164 88 
                     C 168 102, 156 110, 140 110 
                     Z"
                  fill="url(#cloudSurface)"
                  className="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
                />
              </svg>
            </div>
          </div>

          {/* Hero Bottom: 4 Horizontal Metric Chips */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Humidity */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Humidity</p>
                <p className="text-sm sm:text-base font-bold text-white">{humidity}%</p>
              </div>
            </div>

            {/* Wind */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Wind className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Wind</p>
                <p className="text-sm sm:text-base font-bold text-white">{windSpeed} km/h</p>
              </div>
            </div>

            {/* AQI */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <span className="text-base">🍃</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">AQI</p>
                <p className="text-sm sm:text-base font-bold text-white">{aqiValue} <span className="text-xs font-normal text-emerald-400">(Good)</span></p>
              </div>
            </div>

            {/* UV Index */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">UV Index</p>
                <p className="text-sm sm:text-base font-bold text-white">{uvValue} <span className="text-xs font-normal text-amber-400">(High)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. NEXT 6 HOURS ROW                                      */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-5 sm:p-6 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🕒</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Next 6 Hours
            </h2>
          </div>

          {onNavigateToForecast && (
            <button
              type="button"
              onClick={onNavigateToForecast}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
            >
              <span>See More</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* 6 Hourly Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-4">
          {next6Hours.map((slot, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-200/70 dark:border-indigo-500/15 hover:border-indigo-500/40 transition-all text-center"
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {slot.hourLabel}
              </span>
              <span className="text-2xl my-2">
                {slot.conditionIcon || '🌤️'}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                {slot.temperature}°
              </span>
              <div className="flex items-center gap-1 text-[11px] text-sky-500 dark:text-sky-400 font-semibold mt-1">
                <Droplets className="h-3 w-3" />
                <span>{slot.precipitationProbability ?? 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MIDDLE GRID (5-Day Forecast + Alerts + Highlights)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 5 Day Forecast (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  5 Day Forecast
                </h2>
              </div>
              {onNavigateToForecast && (
                <button
                  type="button"
                  onClick={onNavigateToForecast}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
                >
                  <span>More Details</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* 5 Forecast columns / cards */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
              {fiveDayList.map((d, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-200/70 dark:border-indigo-500/15 text-center"
                >
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                    {d.formattedDate}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mb-1">
                    May {14 + idx}
                  </p>
                  <span className="text-2xl my-1.5">{d.conditionIcon || '🌤️'}</span>
                  <div className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {d.tempMax}° <span className="text-[10px] font-normal text-slate-400">/ {d.tempMin}°</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                    {translateCondition(d.conditionText || 'Partly Cloudy')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Stack of Weather Alerts + Today's Highlights (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Weather Alerts Card */}
          <div className="rounded-3xl glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Weather Alerts
                </h2>
              </div>
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                {alerts.length > 0 ? alerts.length : '0'}
              </span>
            </div>

            <div className="space-y-2.5">
              {alerts.length > 0 ? (
                alerts.slice(0, 2).map((a, i) => (
                  <div
                    key={i}
                    onClick={onNavigateToAlerts}
                    className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {a.event}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {a.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Heatwave Advisory</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">High temperatures expected during noon hours</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-3">
                    <span className="text-sm">🍃</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Air Quality Alert</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Moderate AQI, sensitive groups take care</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Today's Highlights */}
          <div className="rounded-3xl glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💡</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Today&apos;s Highlights
              </h2>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🌡️</span>
                <span>Warm and humid conditions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm">☔</span>
                <span>Low chance of rain today</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm">💨</span>
                <span>Light winds from the west</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm">💧</span>
                <span>Good air quality (AQI {aqiValue})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm">☀️</span>
                <span>High UV index, use sunscreen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM GRID (Ask WeatherGPT + Live Weather Map)        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Ask WeatherGPT (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-indigo-400 fill-indigo-400" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Ask WeatherGPT
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Get instant answers about weather, travel, farming, clothes & more!
            </p>

            {/* Prompt suggestion pills (2x2 grid) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {promptChips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onOpenChat(chip.text)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b19]/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all text-left"
                >
                  <span className="text-base">{chip.emoji}</span>
                  <span className="truncate">{chip.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Voice / Text Input Bar */}
          <form onSubmit={handleAskSubmit} className="mt-5 relative flex items-center">
            {/* Embedded Purple Mic Button */}
            <div className="absolute left-2 z-10">
              <GnaniSttButton
                language={language}
                onTranscript={(transcript) => {
                  setAskInput(transcript);
                  onOpenChat(transcript);
                }}
                onStatusChange={setSttStatus}
              />
            </div>

            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder="Ask anything... (e.g. Plan a trip to Manali)"
              className="w-full text-xs sm:text-sm pl-12 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-[#070b19]/90 border border-slate-200/90 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm"
            />

            <button
              type="submit"
              disabled={!askInput.trim()}
              className="absolute right-2 h-8 w-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 transition-all"
              title="Send to WeatherGPT"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          {sttStatus.message && (
            <p className="text-[11px] text-indigo-400 mt-2 font-medium">
              {sttStatus.message}
            </p>
          )}
        </div>

        {/* Right: Live Weather Map (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Live Weather Map
              </h2>
            </div>

            {onNavigateToMaps && (
              <button
                type="button"
                onClick={onNavigateToMaps}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
              >
                <span>View Map</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Interactive Map Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-500/20">
            <WeatherMap
              mode="compact"
              currentLocation={
                weather?.location || {
                  name: 'New Delhi',
                  country: 'India',
                  latitude: 28.6214,
                  longitude: 77.2148,
                }
              }
              activeLayer={mapLayer}
              onLayerChange={setMapLayer}
              onOpenChat={onOpenChat}
              onLocationChange={onLocationChange}
              heightClass="h-56"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. FOOTER: EXPLORE INDIA'S WEATHER                       */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-5 sm:p-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Explore India&apos;s Weather
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Get accurate weather information for any place in India
          </p>
        </div>

        {/* 8 Category filter pills */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {REGION_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = locPrimary.toLowerCase().includes(cat.sampleLocation.name.toLowerCase());
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onLocationChange(cat.sampleLocation)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-50 dark:bg-[#070b19]/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-slate-200/80 dark:border-indigo-500/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-1 text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold truncate w-full">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
