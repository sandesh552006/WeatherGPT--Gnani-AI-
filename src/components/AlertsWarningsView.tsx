'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Sparkles,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  Zap,
  CloudRain,
  Sun,
  Wind,
  Layers,
} from 'lucide-react';
import {
  WeatherAlert,
  AlertSeverity,
  AlertCategory,
  AlertSummaryCounts,
  NowcastItem,
  AlertPreferences,
  IMD_SEVERITY_CONFIG,
} from '@/lib/alertTypes';
import { GeoLocation } from '@/lib/types';
import { getAlertPreferences, saveAlertPreferences, sortAlertsBySeverity } from '@/lib/alertEngine';
import { AlertMap } from './AlertMap';
import { AlertDetailsModal } from './AlertDetailsModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName } from '@/lib/i18n/locations';
import { getLanguageLocale } from '@/lib/i18n/types';

interface AlertsWarningsViewProps {
  currentLocation: GeoLocation;
  onOpenChat: (q?: string) => void;
  onLocationChange?: (loc: GeoLocation) => void;
}

export const AlertsWarningsView: React.FC<AlertsWarningsViewProps> = ({
  currentLocation,
  onOpenChat,
}) => {
  const { language, t } = useTranslation();
  const [locationAlerts, setLocationAlerts] = useState<WeatherAlert[]>([]);
  const [allIndiaAlerts, setAllIndiaAlerts] = useState<WeatherAlert[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<AlertSummaryCounts>({
    redCount: 0,
    orangeCount: 0,
    yellowCount: 0,
    greenCount: 1,
    totalActive: 0,
  });
  const [nowcasts, setNowcasts] = useState<NowcastItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'severity' | 'ending_soon'>('severity');

  // Modals
  const [selectedModalAlert, setSelectedModalAlert] = useState<WeatherAlert | null>(null);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<AlertPreferences>(getAlertPreferences());

  const locName = getLocalizedLocationName(currentLocation, language);

  // Fetch Alerts from /api/alerts
  const loadAlerts = async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/alerts?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&location=${encodeURIComponent(
          currentLocation.name
        )}${refresh ? '&refresh=true' : ''}`
      );
      if (res.ok) {
        const data = await res.json();
        setLocationAlerts(data.locationAlerts || []);
        setAllIndiaAlerts(data.allIndiaAlerts || []);
        setSummaryCounts(data.summaryCounts || { redCount: 0, orangeCount: 0, yellowCount: 0, greenCount: 1, totalActive: 0 });
        setNowcasts(data.nowcasts || []);
        setUpdatedAt(data.updatedAt || '');
      }
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [currentLocation]);

  // Filtering logic
  const filteredAlerts = locationAlerts.filter((alert) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'severe') return alert.severity === 'RED' || alert.severity === 'ORANGE';
    return alert.category === selectedFilter;
  });

  // Sorting logic
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortOrder === 'severity') {
      const order: Record<AlertSeverity, number> = { RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
      return (order[b.severity] || 0) - (order[a.severity] || 0);
    }
    if (sortOrder === 'newest') {
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    }
    if (sortOrder === 'ending_soon') {
      return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
    }
    return 0;
  });

  const handleSavePreferences = (newPrefs: AlertPreferences) => {
    setPreferences(newPrefs);
    saveAlertPreferences(newPrefs);
    setShowPreferences(false);
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* ======================================================== */}
      {/* 1. HEADER                                                */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{t.alerts.bureauTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.alerts.alertsTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.alerts.bureauSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-50 dark:hover:bg-[#162550] border border-slate-200 dark:border-indigo-500/25 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t.alerts.preferences}</span>
          </button>

          <button
            onClick={() => loadAlerts(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-50 dark:hover:bg-[#162550] border border-slate-200 dark:border-indigo-500/25 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
            <span>{loading ? t.common.loading : t.common.refresh}</span>
          </button>

          <button
            onClick={() => onOpenChat(`What official weather alerts and safety warnings are active in ${locName}?`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.nav.askWeatherGPT}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ACTIVE ALERT SUMMARY CARDS (Dashboard style)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Red / Severe */}
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔴</span> {t.alerts.severeWarnings}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
          </div>
          <div className="text-3xl font-black text-rose-950 dark:text-rose-100">{summaryCounts.redCount}</div>
          <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 font-medium">{t.alerts.immediateAction}</p>
        </div>

        {/* Orange / Alert */}
        <div className="p-4 sm:p-5 rounded-3xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-900 dark:text-orange-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🟠</span> {t.alerts.weatherAlerts}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="text-3xl font-black text-orange-950 dark:text-orange-100">{summaryCounts.orangeCount}</div>
          <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-1 font-medium">{t.alerts.bePrepared}</p>
        </div>

        {/* Yellow / Watch */}
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🟡</span> {t.alerts.weatherWatches}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-950 dark:text-amber-100">{summaryCounts.yellowCount}</div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 font-medium">{t.alerts.beUpdated}</p>
        </div>

        {/* Normal / Green */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🟢</span> {t.alerts.normalStations}
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-950 dark:text-emerald-100">
            {Math.max(24 - (summaryCounts.redCount + summaryCounts.orangeCount + summaryCounts.yellowCount), 1)}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-medium">Standard non-hazardous weather</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FILTERS & SORT CONTROLS                               */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0e1834] p-3 rounded-2xl border border-slate-200/80 dark:border-indigo-500/20 shadow-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: t.alerts.allAlerts },
            { id: 'severe', label: t.alerts.severeOnly },
            { id: 'rain', label: t.alerts.rainFilter },
            { id: 'thunderstorm', label: t.alerts.thunderstormFilter },
            { id: 'lightning', label: t.alerts.lightningFilter },
            { id: 'heat', label: t.alerts.heatFilter },
            { id: 'cold', label: t.alerts.coldFilter },
            { id: 'wind', label: t.alerts.windFilter },
            { id: 'flood', label: t.alerts.floodFilter },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === cat.id
                  ? 'bg-[#1d68f5] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500 hidden sm:inline">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="severity">Highest Severity</option>
            <option value="newest">Newest First</option>
            <option value="ending_soon">Ending Soonest</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ACTIVE ALERTS LIST & CALM STATE                       */}
      {/* ======================================================== */}
      <div className="space-y-4">
        {sortedAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedAlerts.map((alert) => {
              const config = IMD_SEVERITY_CONFIG[alert.severity];
              const isRed = alert.severity === 'RED';

              return (
                <div
                  key={alert.id}
                  className={`rounded-3xl p-6 border-2 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                    isRed
                      ? 'bg-rose-50/60 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/50'
                      : alert.severity === 'ORANGE'
                      ? 'bg-orange-50/60 dark:bg-orange-950/25 border-orange-300 dark:border-orange-900/50'
                      : 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  <div>
                    {/* Severity Badge & Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}
                        >
                          {alert.severity === 'RED' ? t.alerts.redAlert : alert.severity === 'ORANGE' ? t.alerts.orangeAlert : t.alerts.yellowAlert}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {config.actionAdvice}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">
                      {alert.event}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      <span>{alert.location}</span>
                      {alert.district && <span>• {alert.district}</span>}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3 mb-4">
                      {alert.description}
                    </p>
                  </div>

                  <div>
                    {/* Timestamps & Source */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">{t.alerts.validUntil}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {new Date(alert.validUntil).toLocaleTimeString(getLanguageLocale(language), {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">{t.notifications.source}</span>
                        <span className="font-bold text-indigo-500 dark:text-indigo-400 truncate block">
                          {alert.source.split('/')[0]?.trim()}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedModalAlert(alert)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold shadow-xs transition-colors text-center"
                      >
                        {t.alerts.viewDetails}
                      </button>

                      <button
                        onClick={() =>
                          onOpenChat(
                            `What does this ${alert.severity} warning for ${alert.event} in ${alert.location} mean and what precautions should I take?`
                          )
                        }
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t.nav.askWeatherGPT}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Professional Calm State */
          <div className="rounded-3xl glass-card p-10 shadow-sm text-center py-14">
            <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4 text-3xl shadow-xs">
              🟢
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.alerts.noAlerts}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              {t.alerts.normalAtmosphereMsg}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Source: India Meteorological Department (IMD) • Checked {updatedAt || 'just now'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. LIVE NOWCAST SECTION (Near-term weather radar)        */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {t.alerts.weatherWatches}
            </h2>
          </div>
          <span className="text-xs text-slate-400">High-Resolution Radar & Ground Observation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nowcasts.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-200/80 dark:border-indigo-500/15 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    {item.category === 'rain' ? '🌧️' : item.category === 'thunderstorm' ? '⛈️' : '🌤️'}
                    <span>{item.event}</span>
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      item.severity === 'RED'
                        ? 'bg-rose-100 text-rose-700'
                        : item.severity === 'ORANGE'
                        ? 'bg-orange-100 text-orange-700'
                        : item.severity === 'YELLOW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">{item.headline}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>⏱ {item.expectedWindow}</span>
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {item.sourceType === 'official' ? 'IMD Bulletin' : 'WeatherGPT Insight'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. INDIA ALERT MAP                                       */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              India Weather Alert Map (Live)
            </h2>
          </div>
          <span className="text-xs text-slate-400">National IMD Warning Spatial Distribution</span>
        </div>

        <AlertMap
          alerts={allIndiaAlerts}
          currentLocation={currentLocation}
          onSelectAlert={(a) => setSelectedModalAlert(a)}
          onOpenChat={onOpenChat}
          heightClass="h-[360px] sm:h-[460px]"
        />
      </div>

      {/* ======================================================== */}
      {/* 7. CIVIL SAFETY GUIDANCE CATALOG                         */}
      {/* ======================================================== */}
      <div className="rounded-3xl glass-card p-4 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {t.alerts.officialImdNotice}
            </h2>
          </div>
          <span className="text-xs text-slate-400">General Public Safety Guidance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Heavy Rain */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-blue-300">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <span>Heavy Rain & Flooding</span>
            </div>
            <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Avoid driving through waterlogged underpasses.</li>
              <li>Disconnect non-essential electrical equipment.</li>
              <li>Keep battery torches and clean water stored.</li>
            </ul>
          </div>

          {/* Thunderstorm & Lightning */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Thunderstorm & Lightning</span>
            </div>
            <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Immediately move inside a sturdy pucca building.</li>
              <li>Stay well away from isolated tall trees.</li>
              <li>Avoid using corded electronic appliances.</li>
            </ul>
          </div>

          {/* Heatwave */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-900 dark:text-rose-300">
              <Sun className="h-4 w-4 text-rose-500" />
              <span>Extreme Heatwave</span>
            </div>
            <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Avoid direct sunlight between 12:00 PM and 3:30 PM.</li>
              <li>Drink water, lemon water, and ORS frequently.</li>
              <li>Wear light, loose cotton fabrics and head coverings.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedModalAlert && (
        <AlertDetailsModal
          alert={selectedModalAlert}
          onClose={() => setSelectedModalAlert(null)}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                <span>Alert Notification Preferences</span>
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2">
                  Alert Severity Levels
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.severities.RED}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          severities: { ...preferences.severities, RED: e.target.checked },
                        })
                      }
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-rose-700">🔴 Red (Severe Weather Warnings)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.severities.ORANGE}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          severities: { ...preferences.severities, ORANGE: e.target.checked },
                        })
                      }
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-orange-700">🟠 Orange (Weather Alerts)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.severities.YELLOW}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          severities: { ...preferences.severities, YELLOW: e.target.checked },
                        })
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-amber-700">🟡 Yellow (Weather Watches)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSavePreferences(preferences)}
                className="px-4 py-2 rounded-xl bg-[#1d68f5] hover:bg-blue-600 text-white text-xs font-bold shadow-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
