'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';
import { WeatherData, GeoLocation } from '@/lib/types';
import { WeatherAlert } from '@/lib/alertTypes';
import { SectorId, OperationalRecommendation } from '@/lib/sectoral/types';
import { generateSectorAdvisory, formatAdvisoryBulletin } from '@/lib/sectoral/engine';
import { SectorSelector } from './SectorSelector';
import { AdvisoryCard } from './AdvisoryCard';
import { AdvisoryTimeline } from './AdvisoryTimeline';
import { WeatherFactorsPanel } from './WeatherFactorsPanel';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName } from '@/lib/i18n/locations';

interface SectoralAdvisoryViewProps {
  weather: WeatherData | null;
  alerts?: WeatherAlert[];
  currentLocation: GeoLocation;
  onOpenChat: (q?: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  initialSector?: SectorId;
}

export const SectoralAdvisoryView: React.FC<SectoralAdvisoryViewProps> = ({
  weather,
  alerts = [],
  currentLocation,
  onOpenChat,
  onRefresh,
  loading = false,
  initialSector,
}) => {
  const { language, t } = useTranslation();
  const [selectedSector, setSelectedSector] = useState<SectorId>(initialSector || 'agriculture');
  const [selectedWhyRec, setSelectedWhyRec] = useState<OperationalRecommendation | null>(null);
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);

  // Sync selected sector when navigated from global search
  React.useEffect(() => {
    if (initialSector) {
      setSelectedSector(initialSector);
    }
  }, [initialSector]);

  // Synthesize sectoral advisory using the pure engine
  const advisory = useMemo(() => {
    return generateSectorAdvisory(selectedSector, weather, alerts);
  }, [selectedSector, weather, alerts]);

  // Handle Export Bulletin
  const handleExportBulletin = () => {
    const text = formatAdvisoryBulletin(advisory);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weathergpt_${selectedSector}_advisory_${currentLocation.name.toLowerCase().replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAskWeatherGPT = () => {
    const question = `Analyze the current ${advisory.sector.name} advisory for ${currentLocation.name}. Primary directive is "${advisory.primaryDirective}". Risk score is ${advisory.riskScore.score}/100. What operational adjustments should be made?`;
    onOpenChat(question);
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. TOP SECTION: MISSION DOMAINS & 8 SECTOR CARDS (Image 1) */}
      <SectorSelector
        selectedSector={selectedSector}
        onSelectSector={setSelectedSector}
        locationName={getLocalizedLocationName(currentLocation, language)}
      />

      {/* 2. MAIN DETAIL GRID (Image 2: Left 8 cols, Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: MAIN ADVISORY PANEL (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl glass-card p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Advisory Header matching Image 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                {selectedSector === 'agriculture'
                  ? '🌱'
                  : selectedSector === 'aviation'
                  ? '✈️'
                  : selectedSector === 'marine'
                  ? '⚓'
                  : selectedSector === 'disaster'
                  ? '🚨'
                  : selectedSector === 'health'
                  ? '❤️'
                  : selectedSector === 'urban'
                  ? '🏙️'
                  : selectedSector === 'transport'
                  ? '🚚'
                  : '⚡'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {(t.sectoral as Record<string, string>)[selectedSector] || advisory.sector.name} Advisory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Synthesized guidance derived from multi-layer NWP and IMD warnings
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${advisory.statusColor}`}
            >
              {advisory.statusLabel}
            </div>
          </div>

          {/* PRIMARY FIELD DIRECTIVE */}
          <div className="p-5 rounded-2xl bg-[#f0f5ff] dark:bg-indigo-950/40 border border-blue-100/90 dark:border-indigo-500/30 space-y-1.5 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
              {t.sectoral.primaryDirective}
            </span>
            <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-snug">
              {advisory.primaryDirective}
            </p>
          </div>

          {/* 4 OPERATIONAL RECOMMENDATION CARDS (2x2 Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advisory.recommendations.map((rec) => (
              <AdvisoryCard
                key={rec.id}
                recommendation={rec}
                onWhyClick={setSelectedWhyRec}
              />
            ))}
          </div>

          {/* 24-HOUR OPERATIONAL TIMELINE RIBBON */}
          <AdvisoryTimeline
            timeline={advisory.timeline}
            sectorName={advisory.sector.name}
          />

          {/* RISK SCORE & ACTION CHECKLIST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Risk Score Summary Card (5 cols) */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-200/80 dark:border-indigo-500/15 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.sectoral.riskScore}</span>
                <button
                  onClick={() => setShowRiskModal(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>Factor Breakdown</span>
                </button>
              </div>

              <div className="flex items-baseline gap-2 my-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {advisory.riskScore.score}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
                <span
                  className={`ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    advisory.riskScore.level === 'Critical' || advisory.riskScore.level === 'High'
                      ? 'bg-rose-100 text-rose-800'
                      : advisory.riskScore.level === 'Moderate'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {advisory.riskScore.level}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    advisory.riskScore.score > 60
                      ? 'bg-rose-500'
                      : advisory.riskScore.score > 35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${advisory.riskScore.score}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {advisory.riskScore.summary}
              </p>
            </div>

            {/* Recommended & Avoid Action Checklist (7 cols) */}
            <div className="md:col-span-7 p-5 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 border border-slate-200/80 dark:border-indigo-500/15 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                {t.sectoral.recommendations}
              </span>

              <div className="space-y-2 text-xs">
                {advisory.recommendedActions.slice(0, 2).map((act, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{act}</span>
                  </div>
                ))}
                {advisory.avoidActions.slice(0, 2).map((act, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <XCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Validated by Meteorological Rules Engine & IMD Guidelines</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBulletin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>{t.sectoral.exportBulletin}</span>
              </button>

              <button
                onClick={handleAskWeatherGPT}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.nav.askWeatherGPT}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WEATHER FACTORS PANEL (4 Cols matching Image 2) */}
        <div className="lg:col-span-4">
          <WeatherFactorsPanel
            factors={advisory.weatherFactors}
            dopplerStatus={advisory.dopplerRadarStatus}
            locationName={getLocalizedLocationName(currentLocation, language)}
          />
        </div>
      </div>

      {/* "Why This Advisory?" Explainability Modal */}
      {selectedWhyRec && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Advisory Decision Rationale
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedWhyRec.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedWhyRec(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Contributing Factor:</span>
                  <span className="font-bold text-slate-800">
                    {selectedWhyRec.whyReason.factorName}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Current Measured Value:</span>
                  <span className="font-bold text-blue-600">
                    {selectedWhyRec.whyReason.currentValue}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Operational Threshold:</span>
                  <span className="font-bold text-slate-700">
                    {selectedWhyRec.whyReason.thresholdValue}
                  </span>
                </div>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1">Operational Impact:</strong>
                <p className="text-slate-600 leading-relaxed">
                  {selectedWhyRec.whyReason.operationalEffect}
                </p>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1">Scientific & Technical Rationale:</strong>
                <p className="text-slate-600 leading-relaxed">
                  {selectedWhyRec.whyReason.scientificReason}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const q = `Explain in detail why "${selectedWhyRec.title}" has an operational effect of "${selectedWhyRec.whyReason.operationalEffect}" for ${currentLocation.name}.`;
                  setSelectedWhyRec(null);
                  onOpenChat(q);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1d68f5] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Discuss with WeatherGPT</span>
              </button>
              <button
                onClick={() => setSelectedWhyRec(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk Score Breakdown Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Risk Score Composition ({advisory.riskScore.score}/100)
                </h3>
                <p className="text-xs text-slate-500">
                  Algorithmic point distribution based on active atmospheric drivers
                </p>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">Baseline Operational Tolerance</span>
                <span className="font-bold text-slate-800">15 pts</span>
              </div>

              {advisory.riskScore.factors.map((f, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{f.name}</span>
                    <span className="text-[10px] text-slate-500">{f.reason}</span>
                  </div>
                  <span className="font-bold text-blue-700 text-sm">+{f.points}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
              Note: WeatherGPT risk scores are deterministic estimates designed for decision support and do not constitute an official statutory liability rating.
            </div>

            <button
              onClick={() => setShowRiskModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
