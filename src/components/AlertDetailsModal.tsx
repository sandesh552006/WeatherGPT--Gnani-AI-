'use client';

import React, { useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { WeatherAlert, IMD_SEVERITY_CONFIG } from '@/lib/alertTypes';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLanguageLocale } from '@/lib/i18n/types';

interface AlertDetailsModalProps {
  alert: WeatherAlert | null;
  onClose: () => void;
  onOpenChat: (q?: string) => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  alert,
  onClose,
  onOpenChat,
}) => {
  const { language, t } = useTranslation();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!alert) return null;

  const config = IMD_SEVERITY_CONFIG[alert.severity];

  const handleAskWeatherGPT = () => {
    const q = `Explain this ${alert.severity} warning for ${alert.event} in ${alert.location}: What does it mean and what safety precautions should I take?`;
    onOpenChat(q);
    onClose();
  };

  const issuedFormatted = (() => {
    try {
      return new Date(alert.issuedAt).toLocaleString(getLanguageLocale(language), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return alert.issuedAt;
    }
  })();

  const validUntilFormatted = (() => {
    try {
      return new Date(alert.validUntil).toLocaleString(getLanguageLocale(language), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return alert.validUntil;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0e1834] shadow-2xl border border-slate-200/90 dark:border-indigo-500/25 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{config.icon}</span>
              <span
                className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}
              >
                {alert.severity} — {config.actionAdvice}
              </span>
              <span className="text-xs text-slate-400 font-medium">ID: {alert.id.slice(0, 10)}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{alert.event}</h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>{alert.location}</span>
              {alert.district && <span>• {alert.district} District</span>}
              {alert.state && <span>• {alert.state}</span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Detailed Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Meteorological Bulletin
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19] border border-slate-200/70 dark:border-indigo-500/20 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {alert.description}
            </div>
          </div>

          {/* Timing details */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070b19] border border-slate-200/70 dark:border-indigo-500/20 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Bulletin Issued</span>
              </div>
              <div className="font-bold text-slate-800 dark:text-white">{issuedFormatted}</div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Clock className="h-3.5 w-3.5 text-rose-500" />
                <span>{t.alerts.validUntil}</span>
              </div>
              <div className="font-bold text-slate-800 dark:text-white">{validUntilFormatted}</div>
            </div>
          </div>

          {/* Safety Checklist */}
          {alert.safetyGuidance && alert.safetyGuidance.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mandatory Safety Checklist
              </h4>
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 space-y-2">
                {alert.safetyGuidance.map((guidance, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{guidance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Attribution */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-indigo-400" />
              <span>Issuing Body: <strong>{alert.source}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Bulletin</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#070b19]/60">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {t.common.close}
          </button>

          <button
            onClick={handleAskWeatherGPT}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>{t.nav.askWeatherGPT}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
