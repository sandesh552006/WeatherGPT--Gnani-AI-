'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  MapPin,
  RefreshCw,
  Download,
  Sparkles,
  Thermometer,
  CloudRain,
  Flame,
  Wind,
  Droplets,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  Calendar,
  Compass,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { GeoLocation } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName, getLocalizedCountry } from '@/lib/i18n/locations';
import {
  HistoricalDailyRecord,
  YearlyAggregate,
  MonthlyAggregate,
  SeasonalAggregate,
  ClimateAnomalyResult,
  ExtremeThresholds,
  ClimateRiskIndicators,
  ClimateTimelineEvent,
  FutureClimateOutlook,
  LocationComparisonItem,
} from '@/lib/climateTypes';
import {
  calculateTrend,
  calculateAnomaly,
  calculateIndianSeasons,
  calculateClimateRisk,
  detectHistoricalExtremes,
  formatAnalysisToCSV,
  DEFAULT_THRESHOLDS,
  aggregateYearly,
} from '@/lib/climateEngine';
import { ClimateLineChart } from './climate/charts/ClimateLineChart';
import { ClimateBarChart } from './climate/charts/ClimateBarChart';
import { ClimateAnomalyChart } from './climate/charts/ClimateAnomalyChart';
import { ClimateGroupedBarChart } from './climate/charts/ClimateGroupedBarChart';

interface ClimateHistoricalViewProps {
  currentLocation: GeoLocation;
  onOpenChat: (question?: string) => void;
  onLocationChange?: (loc: GeoLocation) => void;
}

const POPULAR_CITIES: Array<{ name: string; country: string; lat: number; lon: number }> = [
  { name: 'New Delhi', country: 'India', lat: 28.6214, lon: 77.2148 },
  { name: 'Mumbai', country: 'India', lat: 19.076, lon: 72.8777 },
  { name: 'Bengaluru', country: 'India', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', country: 'India', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', country: 'India', lat: 17.385, lon: 78.4867 },
  { name: 'Jaipur', country: 'India', lat: 26.9124, lon: 75.7873 },
  { name: 'Pune', country: 'India', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', country: 'India', lat: 23.0225, lon: 72.5714 },
  { name: 'Lucknow', country: 'India', lat: 26.8467, lon: 80.9462 },
  { name: 'Srinagar', country: 'India', lat: 34.0837, lon: 74.7973 },
  { name: 'Kochi', country: 'India', lat: 9.9312, lon: 76.2673 },
  { name: 'Guwahati', country: 'India', lat: 26.1445, lon: 91.7362 },
  { name: 'Shimla', country: 'India', lat: 31.1048, lon: 77.1734 },
];

export const ClimateHistoricalView: React.FC<ClimateHistoricalViewProps> = ({
  currentLocation,
  onOpenChat,
  onLocationChange,
}) => {
  const { language, t } = useTranslation();
  // Range & Variable Controls
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState<number>(2000);
  const [endYear, setEndYear] = useState<number>(2025);
  const [explorerVariable, setExplorerVariable] = useState<
    'avgTemp' | 'maxTemp' | 'minTemp' | 'precip' | 'rainyDays' | 'hotDays' | 'wind'
  >('avgTemp');
  const [timeResolution, setTimeResolution] = useState<'yearly' | 'monthly'>('yearly');

  // Baseline & Anomaly Controls
  const [baselineStart, setBaselineStart] = useState<number>(2000);
  const [baselineEnd, setBaselineEnd] = useState<number>(2010);
  const [compareStart, setCompareStart] = useState<number>(2020);
  const [compareEnd, setCompareEnd] = useState<number>(2025);

  // Extreme Weather Threshold Controls
  const [heatThreshold, setHeatThreshold] = useState<number>(35);
  const [rainThreshold, setRainThreshold] = useState<number>(30);
  const [windThreshold, setWindThreshold] = useState<number>(25);

  // Year Comparison Selection
  const [compareYearA, setCompareYearA] = useState<number>(2005);
  const [compareYearB, setCompareYearB] = useState<number>(2015);
  const [compareYearC, setCompareYearC] = useState<number>(2025);

  // Location Comparison Selection
  const [secondaryCity, setSecondaryCity] = useState<string>('Mumbai');
  const [secondaryData, setSecondaryData] = useState<LocationComparisonItem | null>(null);
  const [loadingSecondary, setLoadingSecondary] = useState<boolean>(false);

  // Future Model Selection
  const [selectedProjectionModel, setSelectedProjectionModel] = useState<string>('ensemble');

  // Calculation details modal
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<ClimateTimelineEvent | null>(null);

  // Historical API state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyAggregates, setYearlyAggregates] = useState<YearlyAggregate[]>([]);
  const [monthlyAggregates, setMonthlyAggregates] = useState<MonthlyAggregate[]>([]);
  const [seasons, setSeasons] = useState<Record<string, SeasonalAggregate>>({});
  const [riskIndicators, setRiskIndicators] = useState<ClimateRiskIndicators | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<ClimateTimelineEvent[]>([]);
  const [overview, setOverview] = useState<{
    avgTemp: number;
    annualRainfall: number;
    hotDays: number;
    rainyDays: number;
    tempAnomaly: number;
    avgWindSpeed: number;
  }>({
    avgTemp: 26.5,
    annualRainfall: 750,
    hotDays: 45,
    rainyDays: 60,
    tempAnomaly: 1.1,
    avgWindSpeed: 10.5,
  });

  // Future Climate API state
  const [loadingFuture, setLoadingFuture] = useState<boolean>(true);
  const [futureOutlook, setFutureOutlook] = useState<FutureClimateOutlook | null>(null);

  // Fetch Historical Climate Data
  const fetchHistoricalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/climate/historical?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&name=${encodeURIComponent(
          currentLocation.name
        )}&country=${encodeURIComponent(currentLocation.country || 'India')}&startYear=${startYear}&endYear=${endYear}&timezone=${encodeURIComponent(
          currentLocation.timezone || 'Asia/Kolkata'
        )}`
      );

      if (!res.ok) {
        let msg = 'Historical climate data is currently unavailable.';
        try {
          const errJson = await res.json();
          if (errJson.error) msg = errJson.error;
          else if (errJson.details) msg = errJson.details;
        } catch {}
        throw new Error(msg);
      }

      const json = await res.json();
      setYearlyAggregates(json.yearlyAggregates || []);
      setMonthlyAggregates(json.monthlyAggregates || []);
      setSeasons(json.seasons || {});
      setRiskIndicators(json.riskIndicators || null);
      setTimelineEvents(json.timelineEvents || []);
      if (json.currentOverview) {
        setOverview(json.currentOverview);
      }
    } catch (err: any) {
      console.error('Failed to load historical climate data:', err);
      setError(err.message || 'Historical climate data is currently unavailable.');
    } finally {
      setLoading(false);
    }
  }, [currentLocation, startYear, endYear]);

  // Fetch Future Climate Projections
  const fetchFutureData = useCallback(async () => {
    setLoadingFuture(true);
    try {
      const res = await fetch(
        `/api/climate/projection?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&startYear=2025&endYear=2050`
      );
      if (res.ok) {
        const json = await res.json();
        setFutureOutlook(json);
      }
    } catch (err) {
      console.error('Failed to load future climate projections:', err);
    } finally {
      setLoadingFuture(false);
    }
  }, [currentLocation]);

  // Fetch Secondary City for Location Comparison
  const fetchSecondaryCity = useCallback(async (cityName: string) => {
    const city = POPULAR_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (!city) return;
    setLoadingSecondary(true);
    try {
      const res = await fetch(
        `/api/climate/historical?lat=${city.lat}&lon=${city.lon}&name=${encodeURIComponent(
          city.name
        )}&country=India&startYear=2015&endYear=2025`
      );
      if (res.ok) {
        const json = await res.json();
        const yAgg: YearlyAggregate[] = json.yearlyAggregates || [];
        const avg = (arr: number[]) =>
          arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        setSecondaryData({
          locationName: city.name,
          latitude: city.lat,
          longitude: city.lon,
          avgTemp: Number(avg(yAgg.map((y) => y.avgTemp)).toFixed(1)),
          maxTemp: Math.max(...yAgg.map((y) => y.maxTemp), 35),
          minTemp: Math.min(...yAgg.map((y) => y.minTemp), 10),
          annualRainfall: Math.round(avg(yAgg.map((y) => y.totalPrecipitation))),
          rainyDays: Math.round(avg(yAgg.map((y) => y.rainyDays))),
          hotDays: Math.round(avg(yAgg.map((y) => y.hotDays))),
          avgWind: Number(avg(yAgg.map((y) => y.avgWindSpeed)).toFixed(1)),
          avgHumidity: Math.round(avg(yAgg.map((y) => y.avgHumidity || 60))),
          seasons: json.seasons || {},
        });
      }
    } catch (err) {
      console.error('Failed to fetch secondary city comparison:', err);
    } finally {
      setLoadingSecondary(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoricalData();
    // Stagger future projections slightly
    const futureTimer = setTimeout(() => {
      fetchFutureData();
    }, 400);
    return () => clearTimeout(futureTimer);
  }, [fetchHistoricalData, fetchFutureData]);

  useEffect(() => {
    // Stagger secondary city comparison fetch by 1200ms to prevent hitting Open-Meteo concurrent minutely rate limits
    const timer = setTimeout(() => {
      fetchSecondaryCity(secondaryCity);
    }, 1200);
    return () => clearTimeout(timer);
  }, [secondaryCity, fetchSecondaryCity]);

  // Temperature trend calculation
  const tempPoints = yearlyAggregates.map((y) => ({ x: y.year, y: y.avgTemp }));
  const tempTrend = calculateTrend(tempPoints);

  // Precipitation trend calculation
  const precipPoints = yearlyAggregates.map((y) => ({ x: y.year, y: y.totalPrecipitation }));
  const precipTrend = calculateTrend(precipPoints);

  // Climate Anomaly calculation
  const anomalyResult: ClimateAnomalyResult = calculateAnomaly(
    yearlyAggregates,
    baselineStart,
    baselineEnd,
    compareStart,
    compareEnd
  );

  // Export CSV Handler
  const handleExportCSV = () => {
    if (yearlyAggregates.length === 0) return;
    const csvContent = formatAnalysisToCSV(currentLocation.name, yearlyAggregates);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `climate_analysis_${currentLocation.name.toLowerCase().replace(/\s+/g, '_')}_${startYear}_${endYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Year comparison data
  const yearRecordA = yearlyAggregates.find((y) => y.year === compareYearA);
  const yearRecordB = yearlyAggregates.find((y) => y.year === compareYearB);
  const yearRecordC = yearlyAggregates.find((y) => y.year === compareYearC);

  // Current primary city averages for comparison
  const primaryAvgTemp =
    yearlyAggregates.length > 0
      ? Number(
          (
            yearlyAggregates.reduce((s, y) => s + y.avgTemp, 0) /
            yearlyAggregates.length
          ).toFixed(1)
        )
      : 26.5;

  const primaryAnnualRainfall =
    yearlyAggregates.length > 0
      ? Math.round(
          yearlyAggregates.reduce((s, y) => s + y.totalPrecipitation, 0) /
            yearlyAggregates.length
        )
      : 750;

  const primaryHotDays =
    yearlyAggregates.length > 0
      ? Math.round(
          yearlyAggregates.reduce((s, y) => s + y.hotDays, 0) /
            yearlyAggregates.length
        )
      : 40;

  const primaryRainyDays =
    yearlyAggregates.length > 0
      ? Math.round(
          yearlyAggregates.reduce((s, y) => s + y.rainyDays, 0) /
            yearlyAggregates.length
        )
      : 55;

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. CLIMATE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {t.climate.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {t.climate.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Location badge & actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0e1834] border border-slate-200 dark:border-indigo-500/25 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            <MapPin className="h-3.5 w-3.5 text-rose-500" />
            <span>
              {getLocalizedLocationName(currentLocation, language)}, {getLocalizedCountry(currentLocation.country || 'India', language)}
            </span>
            <span className="text-[10px] text-slate-400 font-normal ml-1">
              ({currentLocation.latitude.toFixed(2)}°N, {currentLocation.longitude.toFixed(2)}°E)
            </span>
          </div>

          <button
            onClick={fetchHistoricalData}
            disabled={loading}
            title="Refresh historical analysis"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-50 dark:hover:bg-[#162550] border border-slate-200 dark:border-indigo-500/25 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{loading ? t.common.loading : t.common.refresh}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={yearlyAggregates.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-50 dark:hover:bg-[#162550] border border-slate-200 dark:border-indigo-500/25 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t.climate.exportCsv}</span>
          </button>

          <button
            onClick={() =>
              onOpenChat(
                `Provide a comprehensive climate trend summary for ${currentLocation.name}, including temperature anomaly and future outlook.`
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 text-xs font-semibold text-white transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.nav.askWeatherGPT}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-slate-200/70" />
            ))}
          </div>
          <div className="h-96 rounded-3xl bg-slate-200/70" />
        </div>
      )}

      {/* Error Alert State */}
      {!loading && error && (
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Historical Climate Data Unavailable</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchHistoricalData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry Fetching Data
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 2. CLIMATE OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Avg Temp */}
            <div className="rounded-3xl glass-card p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Average Temp</span>
                <Thermometer className="h-4 w-4 text-amber-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-800">{overview.avgTemp}°C</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Annual Mean</p>
              </div>
              <div className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                <span>ERA5 Reanalysis</span>
              </div>
            </div>

            {/* Annual Rain */}
            <div className="rounded-3xl glass-card p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Annual Rainfall</span>
                <CloudRain className="h-4 w-4 text-blue-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-800">{overview.annualRainfall} mm</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Yearly Precipitation</p>
              </div>
              <div className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                <span>Total Accumulated</span>
              </div>
            </div>

            {/* Hot Days */}
            <div className="rounded-3xl glass-card p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Hot Days</span>
                <Flame className="h-4 w-4 text-rose-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-800">{overview.hotDays}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Tmax ≥ {heatThreshold}°C</p>
              </div>
              <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                <span>High Thermal Load</span>
              </div>
            </div>

            {/* Rainy Days */}
            <div className="rounded-3xl glass-card p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Rainy Days</span>
                <Droplets className="h-4 w-4 text-teal-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-800">{overview.rainyDays}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Rain ≥ 1.0 mm</p>
              </div>
              <div className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                <span>Precipitation Days</span>
              </div>
            </div>

            {/* Temp Anomaly */}
            <div className="rounded-3xl glass-card p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Temp Anomaly</span>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
              <div className="my-2">
                <span
                  className={`text-2xl font-black ${
                    overview.tempAnomaly >= 0 ? 'text-rose-600' : 'text-sky-600'
                  }`}
                >
                  {overview.tempAnomaly > 0 ? '+' : ''}
                  {overview.tempAnomaly}°C
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">vs Period Normal</p>
              </div>
              <div className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                <span>{overview.tempAnomaly >= 0 ? 'Above Baseline' : 'Below Baseline'}</span>
              </div>
            </div>

            {/* Average Wind */}
            <div className="rounded-3xl glass-card p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Average Wind</span>
                <Wind className="h-4 w-4 text-slate-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-800">{overview.avgWindSpeed} km/h</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Surface 10m Wind</p>
              </div>
              <div className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                <span>Mean Atmospheric</span>
              </div>
            </div>
          </div>

          {/* 3. HISTORICAL WEATHER EXPLORER */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Historical Weather Explorer
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyze long-term climatological time series with configurable variables and time resolution.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Variable Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Variable:</span>
                  <select
                    value={explorerVariable}
                    onChange={(e: any) => setExplorerVariable(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070b19] border border-slate-200 dark:border-indigo-500/30 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="avgTemp">Mean Temperature (°C)</option>
                    <option value="maxTemp">Peak Temperature (°C)</option>
                    <option value="minTemp">Minimum Temperature (°C)</option>
                    <option value="precip">Total Rainfall (mm)</option>
                    <option value="rainyDays">Rainy Days (≥1mm)</option>
                    <option value="hotDays">Hot Days (≥35°C)</option>
                    <option value="wind">Wind Speed (km/h)</option>
                  </select>
                </div>

                {/* Range Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Years:</span>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
                    className="px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070b19] border border-slate-200 dark:border-indigo-500/30 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {[2000, 2005, 2010, 2015, 2018].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">to</span>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                    className="px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070b19] border border-slate-200 dark:border-indigo-500/30 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {[2020, 2022, 2024, 2025, 2026].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#070b19] p-1 text-xs font-semibold border border-slate-200 dark:border-indigo-500/20">
                  <button
                    onClick={() => setTimeResolution('yearly')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      timeResolution === 'yearly'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    onClick={() => setTimeResolution('monthly')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      timeResolution === 'monthly'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Explorer Chart Rendering */}
            <div className="pt-2">
              {timeResolution === 'yearly' ? (
                explorerVariable === 'precip' || explorerVariable === 'rainyDays' || explorerVariable === 'hotDays' ? (
                  <ClimateBarChart
                    data={yearlyAggregates.map((y) => ({
                      label: y.year,
                      value:
                        explorerVariable === 'precip'
                          ? y.totalPrecipitation
                          : explorerVariable === 'rainyDays'
                          ? y.rainyDays
                          : y.hotDays,
                      color:
                        explorerVariable === 'precip'
                          ? '#3b82f6'
                          : explorerVariable === 'rainyDays'
                          ? '#0d9488'
                          : '#f43f5e',
                    }))}
                    unit={
                      explorerVariable === 'precip'
                        ? 'mm'
                        : ' days'
                    }
                    defaultColor="#3b82f6"
                    height={250}
                  />
                ) : (
                  <ClimateLineChart
                    series={[
                      {
                        id: 'explorer',
                        name:
                          explorerVariable === 'avgTemp'
                            ? 'Mean Temperature'
                            : explorerVariable === 'maxTemp'
                            ? 'Max Temperature'
                            : explorerVariable === 'minTemp'
                            ? 'Min Temperature'
                            : 'Wind Speed',
                        color:
                          explorerVariable === 'wind'
                            ? '#0f766e'
                            : explorerVariable === 'minTemp'
                            ? '#0284c7'
                            : explorerVariable === 'maxTemp'
                            ? '#e11d48'
                            : '#2563eb',
                        data: yearlyAggregates.map((y) => ({
                          x: y.year,
                          y:
                            explorerVariable === 'avgTemp'
                              ? y.avgTemp
                              : explorerVariable === 'maxTemp'
                              ? y.maxTemp
                              : explorerVariable === 'minTemp'
                              ? y.minTemp
                              : y.avgWindSpeed,
                        })),
                      },
                    ]}
                    unit={explorerVariable === 'wind' ? ' km/h' : '°C'}
                    height={250}
                  />
                )
              ) : (
                /* Monthly Resolution */
                <ClimateLineChart
                  series={[
                    {
                      id: 'monthly_var',
                      name: `${explorerVariable} (Monthly)`,
                      color: '#2563eb',
                      data: monthlyAggregates.slice(-36).map((m) => ({
                        x: `${m.monthLabel} '${m.year.toString().slice(-2)}`,
                        y:
                          explorerVariable === 'precip'
                            ? m.totalPrecipitation
                            : explorerVariable === 'rainyDays'
                            ? m.rainyDays
                            : m.avgTemp,
                      })),
                    },
                  ]}
                  unit={explorerVariable === 'precip' ? ' mm' : explorerVariable === 'rainyDays' ? ' days' : '°C'}
                  height={250}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>Resolution: {timeResolution.toUpperCase()} aggregation from Open-Meteo ERA5 Reanalysis</span>
              <button
                onClick={() =>
                  onOpenChat(
                    `Explain the ${explorerVariable} historical trends for ${currentLocation.name} from ${startYear} to ${endYear}.`
                  )
                }
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Ask WeatherGPT about this</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 4. TEMPERATURE TREND & 5. RAINFALL TREND (2 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature Trend */}
            <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-amber-500" />
                    Temperature Trend
                  </h3>
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      tempTrend.changeTotal > 0
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    Trend: {tempTrend.changeTotal > 0 ? '+' : ''}
                    {tempTrend.changeTotal}°C over {yearlyAggregates.length} yrs
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Annual mean temperature computed from daily reanalysis. Trend: +
                  {(tempTrend.slope * 10).toFixed(2)}°C per decade.
                </p>
              </div>

              <ClimateLineChart
                series={[
                  {
                    id: 'annual_mean_temp',
                    name: 'Annual Mean Temp',
                    color: '#2563eb',
                    data: yearlyAggregates.map((y) => ({ x: y.year, y: y.avgTemp })),
                  },
                  {
                    id: 'annual_max_temp',
                    name: 'Peak Tmax',
                    color: '#f43f5e',
                    strokeDash: '4 4',
                    data: yearlyAggregates.map((y) => ({ x: y.year, y: y.maxTemp })),
                  },
                ]}
                unit="°C"
                height={220}
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Linear slope: {tempTrend.slope > 0 ? '+' : ''}
                  {tempTrend.slope}°C/yr
                </span>
                <button
                  onClick={() =>
                    onOpenChat(
                      `Why is ${currentLocation.name}'s temperature trending by ${tempTrend.changeTotal}°C over the past ${yearlyAggregates.length} years?`
                    )
                  }
                  className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Ask WeatherGPT</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Rainfall Trend */}
            <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-blue-500" />
                    Annual Rainfall Trend
                  </h3>
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      precipTrend.changeTotal >= 0
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {precipTrend.changeTotal >= 0 ? '+' : ''}
                    {Math.round(precipTrend.changeTotal)} mm change
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Annual cumulative precipitation totals with average baseline.
                </p>
              </div>

              <ClimateBarChart
                data={yearlyAggregates.map((y) => ({
                  label: y.year,
                  value: y.totalPrecipitation,
                  color: '#3b82f6',
                  secondaryLabel: `${y.rainyDays} rainy days`,
                }))}
                unit=" mm"
                defaultColor="#3b82f6"
                height={220}
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Mean rainfall: {Math.round(primaryAnnualRainfall)} mm/year
                </span>
                <button
                  onClick={() =>
                    onOpenChat(
                      `Explain the rainfall patterns and monsoon trends in ${currentLocation.name}. Has precipitation become more erratic?`
                    )
                  }
                  className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Ask WeatherGPT</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 6. CLIMATE ANOMALY SECTION */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Climate Anomaly Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Measures temperature and rainfall divergence against a defined historical climatological baseline.
                </p>
              </div>

              {/* Baseline Period Configurator */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Baseline:</span>
                  <select
                    value={baselineStart}
                    onChange={(e) => setBaselineStart(parseInt(e.target.value, 10))}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700"
                  >
                    {[1990, 1995, 2000, 2005].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">–</span>
                  <select
                    value={baselineEnd}
                    onChange={(e) => setBaselineEnd(parseInt(e.target.value, 10))}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700"
                  >
                    {[2005, 2010, 2015].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-300">vs</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Recent:</span>
                  <select
                    value={compareStart}
                    onChange={(e) => setCompareStart(parseInt(e.target.value, 10))}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700"
                  >
                    {[2015, 2018, 2020].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">–</span>
                  <select
                    value={compareEnd}
                    onChange={(e) => setCompareEnd(parseInt(e.target.value, 10))}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700"
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Anomaly Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Baseline Mean</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {anomalyResult.baselineAvgTemp}°C
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Period {baselineStart}–{baselineEnd}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Recent Period Mean</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {anomalyResult.compareAvgTemp}°C
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Period {compareStart}–{compareEnd}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  anomalyResult.tempAnomaly >= 0
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-sky-50/70 border-sky-200'
                }`}
              >
                <span className="text-xs font-medium text-slate-600">Net Thermal Anomaly</span>
                <div
                  className={`text-xl font-black mt-1 ${
                    anomalyResult.tempAnomaly >= 0 ? 'text-rose-600' : 'text-sky-600'
                  }`}
                >
                  {anomalyResult.tempAnomaly > 0 ? '+' : ''}
                  {anomalyResult.tempAnomaly}°C
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                  {anomalyResult.status === 'above' ? '🟠 Above baseline' : '🔵 Below baseline'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Extreme Heat Delta</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {anomalyResult.hotDaysDiff > 0 ? '+' : ''}
                  {anomalyResult.hotDaysDiff} days
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Hot days (≥35°C) per year</div>
              </div>
            </div>

            {/* Anomaly Divergence Chart */}
            <div className="pt-2">
              <ClimateAnomalyChart
                data={anomalyResult.yearlyAnomalies.map((a) => ({
                  year: a.year,
                  anomaly: a.tempAnomaly,
                }))}
                unit="°C"
                height={220}
                baselineLabel={`Baseline: ${baselineStart}–${baselineEnd} (${anomalyResult.baselineAvgTemp}°C)`}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                Data-derived anomaly computed via WeatherGPT Engine. Baseline normal: {baselineStart}–{baselineEnd}.
              </span>
              <button
                onClick={() =>
                  onOpenChat(
                    `Explain the climate anomaly of ${anomalyResult.tempAnomaly > 0 ? '+' : ''}${anomalyResult.tempAnomaly}°C in ${currentLocation.name} compared with the ${baselineStart}–${baselineEnd} baseline.`
                  )
                }
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Ask WeatherGPT to explain</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 7. EXTREME WEATHER ANALYSIS */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Flame className="h-5 w-5 text-rose-500" />
                  Extreme Weather Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracks frequency of high-impact days crossing analytical thresholds.
                </p>
              </div>

              {/* Threshold Selector Tabs */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Heat Threshold:</span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 font-semibold">
                  {[35, 40, 42].map((thresh) => (
                    <button
                      key={thresh}
                      onClick={() => setHeatThreshold(thresh)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        heatThreshold === thresh
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ≥{thresh}°C
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extreme Heat Days Bar Chart */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Annual Frequency of Days with Maximum Temperature ≥ {heatThreshold}°C
              </span>
              <ClimateBarChart
                data={yearlyAggregates.map((y) => ({
                  label: y.year,
                  value: y.hotDays,
                  color: y.hotDays > 50 ? '#e11d48' : y.hotDays > 30 ? '#f97316' : '#fbbf24',
                  secondaryLabel: `${y.hotDays} days exceeded ${heatThreshold}°C`,
                }))}
                unit=" days"
                defaultColor="#f97316"
                height={200}
              />
            </div>

            {/* Heavy Rain & Strong Wind mini metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Extreme Heat Days (Total)</span>
                  <Flame className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  {yearlyAggregates.reduce((s, y) => s + y.hotDays, 0)} days
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Across selected {yearlyAggregates.length} years
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Heavy Rainfall Days (≥30mm)</span>
                  <CloudRain className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  {yearlyAggregates.reduce((s, y) => s + y.extremePrecipDays, 0)} days
                </div>
                <p className="text-[11px] text-slate-400 mt-1">IMD Heavy Rain Category</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Strong Wind Days (≥25 km/h)</span>
                  <Wind className="h-4 w-4 text-teal-500" />
                </div>
                <div className="text-2xl font-black text-slate-800 mt-2">
                  {yearlyAggregates.reduce((s, y) => s + y.strongWindDays, 0)} days
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Breezy/Squall Atmospheric Days</p>
              </div>
            </div>
          </div>

          {/* 8. SEASONAL ANALYSIS */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  Seasonal Climate Breakdown (IMD Standard Seasons)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Long-term climatological averages grouped by India's standard meteorological seasons.
                </p>
              </div>
              <button
                onClick={() =>
                  onOpenChat(
                    `How do the seasons in ${currentLocation.name} vary between Winter, Pre-Monsoon, Monsoon, and Post-Monsoon?`
                  )
                }
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Ask WeatherGPT</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(seasons).map(([seasonKey, s]) => {
                const getSeasonIcon = (name: string) => {
                  if (name === 'Winter') return '❄️';
                  if (name === 'Pre-Monsoon') return '☀️';
                  if (name === 'Monsoon') return '🌧️';
                  return '🍂';
                };

                return (
                  <div
                    key={seasonKey}
                    className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{getSeasonIcon(seasonKey)}</span>
                          {seasonKey}
                        </span>
                        <p className="text-[11px] text-slate-400">{s.monthsLabel}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Mean Temp:</span>
                        <span className="font-bold text-slate-800">{s.avgTemp}°C</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Rainfall:</span>
                        <span className="font-bold text-blue-600">{s.totalPrecipitation} mm</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Avg Humidity:</span>
                        <span className="font-bold text-teal-600">{s.avgHumidity}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Wind Speed:</span>
                        <span className="font-bold text-slate-700">{s.avgWindSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 9. YEAR COMPARISON */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <span>⚖️</span> Year Comparison (Multi-Year Benchmark)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare weather parameters across three distinct historical years using actual recorded data.
                </p>
              </div>

              {/* Year Selectors */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Year A:</span>
                  <select
                    value={compareYearA}
                    onChange={(e) => setCompareYearA(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 font-bold text-blue-900"
                  >
                    {yearlyAggregates.map((y) => (
                      <option key={y.year} value={y.year}>
                        {y.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Year B:</span>
                  <select
                    value={compareYearB}
                    onChange={(e) => setCompareYearB(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 font-bold text-indigo-900"
                  >
                    {yearlyAggregates.map((y) => (
                      <option key={y.year} value={y.year}>
                        {y.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Year C:</span>
                  <select
                    value={compareYearC}
                    onChange={(e) => setCompareYearC(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 font-bold text-purple-900"
                  >
                    {yearlyAggregates.map((y) => (
                      <option key={y.year} value={y.year}>
                        {y.year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-3 w-1/3">Meteorological Metric</th>
                    <th className="pb-3 text-blue-600 font-bold">{compareYearA}</th>
                    <th className="pb-3 text-indigo-600 font-bold">{compareYearB}</th>
                    <th className="pb-3 text-purple-600 font-bold">{compareYearC}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr>
                    <td className="py-2.5 text-slate-500 flex items-center gap-2">
                      <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                      Annual Average Temp
                    </td>
                    <td className="py-2.5 font-bold">{yearRecordA?.avgTemp ?? '—'}°C</td>
                    <td className="py-2.5 font-bold">{yearRecordB?.avgTemp ?? '—'}°C</td>
                    <td className="py-2.5 font-bold">{yearRecordC?.avgTemp ?? '—'}°C</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 flex items-center gap-2">
                      <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                      Total Rainfall
                    </td>
                    <td className="py-2.5 font-bold text-blue-600">
                      {yearRecordA?.totalPrecipitation ?? '—'} mm
                    </td>
                    <td className="py-2.5 font-bold text-blue-600">
                      {yearRecordB?.totalPrecipitation ?? '—'} mm
                    </td>
                    <td className="py-2.5 font-bold text-blue-600">
                      {yearRecordC?.totalPrecipitation ?? '—'} mm
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 flex items-center gap-2">
                      <Flame className="h-3.5 w-3.5 text-rose-500" />
                      Hot Days (≥35°C)
                    </td>
                    <td className="py-2.5 font-bold">{yearRecordA?.hotDays ?? '—'}</td>
                    <td className="py-2.5 font-bold">{yearRecordB?.hotDays ?? '—'}</td>
                    <td className="py-2.5 font-bold">{yearRecordC?.hotDays ?? '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 flex items-center gap-2">
                      <Droplets className="h-3.5 w-3.5 text-teal-500" />
                      Rainy Days (≥1mm)
                    </td>
                    <td className="py-2.5 font-bold">{yearRecordA?.rainyDays ?? '—'}</td>
                    <td className="py-2.5 font-bold">{yearRecordB?.rainyDays ?? '—'}</td>
                    <td className="py-2.5 font-bold">{yearRecordC?.rainyDays ?? '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 flex items-center gap-2">
                      <Thermometer className="h-3.5 w-3.5 text-rose-600" />
                      Peak Max Temp
                    </td>
                    <td className="py-2.5 font-bold">{yearRecordA?.maxTemp ?? '—'}°C</td>
                    <td className="py-2.5 font-bold">{yearRecordB?.maxTemp ?? '—'}°C</td>
                    <td className="py-2.5 font-bold">{yearRecordC?.maxTemp ?? '—'}°C</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grouped Comparison Chart */}
            <div className="pt-2">
              <ClimateGroupedBarChart
                categories={[
                  {
                    category: 'Hot Days (≥35°)',
                    values: {
                      yearA: yearRecordA?.hotDays || 0,
                      yearB: yearRecordB?.hotDays || 0,
                      yearC: yearRecordC?.hotDays || 0,
                    },
                  },
                  {
                    category: 'Rainy Days',
                    values: {
                      yearA: yearRecordA?.rainyDays || 0,
                      yearB: yearRecordB?.rainyDays || 0,
                      yearC: yearRecordC?.rainyDays || 0,
                    },
                  },
                  {
                    category: 'Rainfall (÷10 mm)',
                    values: {
                      yearA: Math.round((yearRecordA?.totalPrecipitation || 0) / 10),
                      yearB: Math.round((yearRecordB?.totalPrecipitation || 0) / 10),
                      yearC: Math.round((yearRecordC?.totalPrecipitation || 0) / 10),
                    },
                  },
                ]}
                seriesList={[
                  { id: 'yearA', name: `Year ${compareYearA}`, color: '#3b82f6', unit: '' },
                  { id: 'yearB', name: `Year ${compareYearB}`, color: '#6366f1', unit: '' },
                  { id: 'yearC', name: `Year ${compareYearC}`, color: '#a855f7', unit: '' },
                ]}
                height={220}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Computed strictly from ERA5 historical daily readings
              </span>
              <button
                onClick={() =>
                  onOpenChat(
                    `Compare weather between ${compareYearA}, ${compareYearB}, and ${compareYearC} in ${currentLocation.name}. Why did rainfall or hot days differ?`
                  )
                }
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Ask WeatherGPT to compare</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 10. LOCATION COMPARISON */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Compass className="h-5 w-5 text-teal-600" />
                  Location Climatology Comparison
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare {currentLocation.name} with another major Indian city using live reanalysis APIs.
                </p>
              </div>

              {/* City Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Compare with:</span>
                <select
                  value={secondaryCity}
                  onChange={(e) => setSecondaryCity(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingSecondary ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Fetching historical climatology for {secondaryCity}...
              </div>
            ) : secondaryData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Primary City Card */}
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      {getLocalizedLocationName(currentLocation, language)} (Active)
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                      Current Location
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Annual Mean Temp:</span>
                      <span className="text-base font-bold text-slate-800">{primaryAvgTemp}°C</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Annual Rainfall:</span>
                      <span className="text-base font-bold text-blue-600">
                        {primaryAnnualRainfall} mm
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hot Days (≥35°C):</span>
                      <span className="text-base font-bold text-rose-600">{primaryHotDays} days</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rainy Days:</span>
                      <span className="text-base font-bold text-teal-600">{primaryRainyDays} days</span>
                    </div>
                  </div>
                </div>

                {/* Secondary City Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-600" />
                      {secondaryData.locationName}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                      Benchmark City
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Annual Mean Temp:</span>
                      <span className="text-base font-bold text-slate-800">
                        {secondaryData.avgTemp}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Annual Rainfall:</span>
                      <span className="text-base font-bold text-blue-600">
                        {secondaryData.annualRainfall} mm
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hot Days (≥35°C):</span>
                      <span className="text-base font-bold text-rose-600">
                        {secondaryData.hotDays} days
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rainy Days:</span>
                      <span className="text-base font-bold text-teal-600">
                        {secondaryData.rainyDays} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Both datasets retrieved in real-time from Open-Meteo ERA5 Reanalysis
              </span>
              <button
                onClick={() =>
                  onOpenChat(
                    `Compare the climates of ${currentLocation.name} and ${secondaryCity}. Which has a more intense monsoon, and which experiences more extreme heat?`
                  )
                }
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Ask WeatherGPT to analyze differences</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 11. CLIMATE RISK INSIGHTS & SCORECARD */}
          {riskIndicators && (
            <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">
                      WeatherGPT Climate Risk Insights
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data-derived indicators calculated from historical extreme frequency and variability.
                  </p>
                </div>

                <button
                  onClick={() => setShowMethodologyModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/60"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>How is this calculated?</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Heat Exposure */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-rose-500" />
                      Heat Exposure
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        riskIndicators.heatExposure.level === 'High' ||
                        riskIndicators.heatExposure.level === 'Very High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {riskIndicators.heatExposure.level}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${riskIndicators.heatExposure.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {riskIndicators.heatExposure.description}
                  </p>
                </div>

                {/* Rain Exposure */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CloudRain className="h-4 w-4 text-blue-500" />
                      Heavy Rain Exposure
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        riskIndicators.rainExposure.level === 'High' ||
                        riskIndicators.rainExposure.level === 'Very High'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {riskIndicators.rainExposure.level}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${riskIndicators.rainExposure.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {riskIndicators.rainExposure.description}
                  </p>
                </div>

                {/* Dry Exposure */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>🌵</span> Dry Period Exposure
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {riskIndicators.dryExposure.level}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${riskIndicators.dryExposure.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {riskIndicators.dryExposure.description}
                  </p>
                </div>

                {/* Rainfall Variability */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      Rainfall Variability
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {riskIndicators.rainfallVariability.level}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${riskIndicators.rainfallVariability.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {riskIndicators.rainfallVariability.description}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Transparency Notice:</strong> These risk insights are algorithmic analytical estimates derived from ERA5 reanalysis frequency metrics. They do not constitute an official statutory disaster assessment by IMD or NDMA.
                </p>
              </div>
            </div>
          )}

          {/* 12. FUTURE CLIMATE OUTLOOK (2025–2050) & 13. MULTI-MODEL PROJECTION */}
          <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔮</span>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">
                    Future Climate Outlook (2025 – 2050)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-model CMIP6 HighResMIP projections from Open-Meteo Climate API.
                </p>
              </div>

              {/* Model Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Projection View:</span>
                <select
                  value={selectedProjectionModel}
                  onChange={(e) => setSelectedProjectionModel(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="ensemble">Ensemble Consensus (Multi-Model Mean)</option>
                  <option value="EC_Earth3P_HR">EC-Earth3P-HR (Europe)</option>
                  <option value="MRI_AGCM3_2_S">MRI-AGCM3-2-S (Japan)</option>
                  <option value="MPI_ESM1_2_XR">MPI-ESM1-2-XR (Germany)</option>
                </select>
              </div>
            </div>

            {/* Model Disclaimer Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-3 text-xs text-blue-900">
              <span className="text-base">⚠️</span>
              <div>
                <span className="font-bold block">Climate-Model Projection Notice</span>
                <p className="text-[11px] text-blue-800/90 leading-relaxed mt-0.5">
                  This is a long-term climate-model projection based on standardized greenhouse gas pathways (SSP2-4.5 / SSP5-8.5), <strong>not a guaranteed daily weather forecast</strong>. Different models reflect climate sensitivity variations.
                </p>
              </div>
            </div>

            {loadingFuture ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Querying CMIP6 HighResMIP climate models...
              </div>
            ) : futureOutlook && futureOutlook.projections.length > 0 ? (
              <div className="space-y-6">
                {/* Projections Line Chart */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Projected Annual Mean Temperature Trajectory (2025 – 2050)
                  </span>
                  <ClimateLineChart
                    series={[
                      {
                        id: 'ensemble',
                        name: 'Ensemble Consensus',
                        color: '#2563eb',
                        data: futureOutlook.projections.map((p) => ({
                          x: p.year,
                          y: p.ensembleTemp,
                        })),
                      },
                      ...(selectedProjectionModel !== 'ensemble' &&
                      futureOutlook.projections[0]?.models[selectedProjectionModel]
                        ? [
                            {
                              id: selectedProjectionModel,
                              name: selectedProjectionModel.replace(/_/g, ' '),
                              color: '#ec4899',
                              strokeDash: '4 4',
                              data: futureOutlook.projections.map((p) => ({
                                x: p.year,
                                y: p.models[selectedProjectionModel]?.temp || p.ensembleTemp,
                              })),
                            },
                          ]
                        : []),
                    ]}
                    unit="°C"
                    height={230}
                  />
                </div>

                {/* Decadal Projection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[2030, 2040, 2050].map((targetYr) => {
                    const pt = futureOutlook.projections.find((p) => p.year === targetYr) ||
                      futureOutlook.projections[futureOutlook.projections.length - 1];
                    const delta = Number((pt.ensembleTemp - futureOutlook.baselineTemp).toFixed(2));

                    return (
                      <div
                        key={targetYr}
                        className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Target Year</span>
                          <span className="text-xs font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                            {targetYr}
                          </span>
                        </div>
                        <div className="text-xl font-black text-slate-800">
                          {pt.ensembleTemp}°C
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>+{delta}°C vs 2025 baseline</span>
                        </div>
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          Projected rainfall: ~{pt.ensemblePrecip} mm/year
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Future projections are temporarily unavailable from the climate model endpoint. Historical climate analysis remains active.
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                CMIP6 HighResMIP Ensemble Consensus (EC-Earth3P, MRI-AGCM, MPI-ESM)
              </span>
              <button
                onClick={() =>
                  onOpenChat(
                    `Explain the projected future climate changes for ${currentLocation.name} up to 2050. How will monsoon rainfall and summer heat stress change?`
                  )
                }
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Ask WeatherGPT to analyze projections</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 14. CLIMATE TIMELINE (DATA-DERIVED HISTORICAL EXTREMES) */}
          {timelineEvents.length > 0 && (
            <div className="rounded-3xl glass-card p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span>⏳</span> Climate Timeline — Detected Historical Extremes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authentic peak milestones detected directly from the daily reanalysis time series.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedTimelineEvent(event)}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 cursor-pointer transition-all duration-150 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {event.year}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          event.category === 'heat'
                            ? 'bg-rose-100 text-rose-800'
                            : event.category === 'rain'
                            ? 'bg-blue-100 text-blue-800'
                            : event.category === 'wind'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {event.category}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h4>

                    <div className="text-lg font-black text-slate-900">{event.measuredValue}</div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{event.date}</span>
                      <span className="text-blue-600 font-semibold group-hover:underline">Details</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. AI CLIMATE INSIGHTS & "WHAT CHANGED?" */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0d2144] via-[#0b1b36] to-[#08162e] text-white p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    AI Climate Insights & "What Changed?"
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real mathematical comparison of {currentLocation.name}'s climate between {baselineStart}–{baselineEnd} and recent years.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  onOpenChat(
                    `Give me a detailed climate synthesis for ${currentLocation.name}. Over the selected period, temperature shifted by ${anomalyResult.tempAnomaly}°C and rainfall changed by ${anomalyResult.precipAnomalyPercent}%. Explain the environmental impact.`
                  )
                }
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 self-start md:self-auto"
              >
                <span>Analyze with Ask WeatherGPT</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* "What Changed?" Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400">🌡️ Temperature Shift</span>
                <div
                  className={`text-2xl font-black mt-1 ${
                    anomalyResult.tempAnomaly >= 0 ? 'text-rose-400' : 'text-sky-400'
                  }`}
                >
                  {anomalyResult.tempAnomaly > 0 ? '+' : ''}
                  {anomalyResult.tempAnomaly}°C
                </div>
                <p className="text-[11px] text-slate-400 mt-1">vs {baselineStart}–{baselineEnd} baseline</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400">🌧️ Rainfall Variation</span>
                <div
                  className={`text-2xl font-black mt-1 ${
                    anomalyResult.precipAnomalyPercent >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {anomalyResult.precipAnomalyPercent > 0 ? '+' : ''}
                  {anomalyResult.precipAnomalyPercent}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {anomalyResult.compareAvgPrecip - anomalyResult.baselineAvgPrecip > 0 ? '+' : ''}
                  {anomalyResult.compareAvgPrecip - anomalyResult.baselineAvgPrecip} mm net delta
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400">🔥 Extreme Heat Days</span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {anomalyResult.hotDaysDiff > 0 ? '+' : ''}
                  {anomalyResult.hotDaysDiff} days/yr
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Days reaching ≥35°C</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400">💧 Rainy Days Count</span>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {anomalyResult.rainyDaysDiff > 0 ? '+' : ''}
                  {anomalyResult.rainyDaysDiff} days/yr
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Days with rain ≥1mm</p>
              </div>
            </div>
          </div>

          {/* 16. DATA SOURCES & METHODOLOGY */}
          <div className="rounded-3xl bg-slate-100/70 p-6 border border-slate-200 text-xs text-slate-600 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Scientific Sources & Methodology Disclosure
              </span>
              <span className="text-[11px] text-slate-500">
                Open-Meteo & IMD Harmonized Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="block text-slate-800 mb-1">Historical Meteorological Data</strong>
                Open-Meteo Historical Weather API powered by the European Centre for Medium-Range Weather Forecasts (ECMWF) ERA5 and ERA5-Land reanalysis models (30km and 9km resolution).
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="block text-slate-800 mb-1">Future Climate Projections</strong>
                Open-Meteo Climate API integrating Coupled Model Intercomparison Project Phase 6 (CMIP6) HighResMIP models (EC-Earth3P-HR, MRI-AGCM3-2-S, MPI-ESM1-2-XR).
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="block text-slate-800 mb-1">India Climatology Guidelines</strong>
                Seasonal classifications and heavy rainfall categories align with the India Meteorological Department (IMD) standards (Winter, Pre-Monsoon, Monsoon, Post-Monsoon).
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              <span>All metrics derived algorithmically from authentic physical reanalysis arrays. Zero synthetic or fake values.</span>
              <span className="font-semibold text-slate-700">WeatherGPT Climate v1.0</span>
            </div>
          </div>
        </>
      )}

      {/* Methodology Modal */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                How Climate Risk Insights Are Calculated
              </h3>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div>
                <strong className="text-slate-800">1. Heat Exposure:</strong>
                <p>
                  Evaluated from the 10-year rolling average of days where the daily maximum temperature exceeds 35°C (configurable to 40°C or 42°C), weighted against the 10-year trendline.
                </p>
              </div>

              <div>
                <strong className="text-slate-800">2. Heavy Rain Exposure:</strong>
                <p>
                  Calculated from the frequency of days recording daily precipitation ≥ 30 mm (IMD rather heavy rain threshold) over the past decade.
                </p>
              </div>

              <div>
                <strong className="text-slate-800">3. Dry Period Exposure:</strong>
                <p>
                  Identifies drought vulnerability by checking the occurrence of annual precipitation deficits exceeding 25% below the multi-year mean.
                </p>
              </div>

              <div>
                <strong className="text-slate-800">4. Rainfall Variability:</strong>
                <p>
                  Measures the Coefficient of Variation (CV = standard deviation / mean × 100%) of annual rainfall totals across the selected time horizon.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                Note: This calculation provides empirical analytical risk insights and does not replace official IMD hazard zoning.
              </div>
            </div>

            <button
              onClick={() => setShowMethodologyModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Close Methodology
            </button>
          </div>
        </div>
      )}

      {/* Timeline Event Details Modal */}
      {selectedTimelineEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Historical Milestone Event
              </span>
              <button
                onClick={() => setSelectedTimelineEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                {selectedTimelineEvent.title}
              </h3>
              <div className="text-3xl font-black text-slate-900">
                {selectedTimelineEvent.measuredValue}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Recorded on {selectedTimelineEvent.date} in {currentLocation.name}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedTimelineEvent.description}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div>
                <strong>Threshold Context:</strong> {selectedTimelineEvent.thresholdContext}
              </div>
              <div>
                <strong>Authoritative Source:</strong> {selectedTimelineEvent.source}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const q = `Tell me more about the historical weather event on ${selectedTimelineEvent.date} in ${currentLocation.name} when ${selectedTimelineEvent.measuredValue} was recorded.`;
                  setSelectedTimelineEvent(null);
                  onOpenChat(q);
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask WeatherGPT</span>
              </button>
              <button
                onClick={() => setSelectedTimelineEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
