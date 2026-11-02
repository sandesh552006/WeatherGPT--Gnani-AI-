'use client';

import React, { useEffect } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WeatherAlert, IMD_SEVERITY_CONFIG } from '@/lib/alertTypes';
import { dismissAlert, generateAlertKey } from '@/lib/alertEngine';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLanguageLocale } from '@/lib/i18n/types';

interface AlertPopupProps {
  alert: WeatherAlert | null;
  onDismiss: () => void;
  onViewAlert: (alert: WeatherAlert) => void;
  onOpenChat: (question?: string) => void;
}

export const AlertPopup: React.FC<AlertPopupProps> = ({
  alert,
  onDismiss,
  onViewAlert,
  onOpenChat,
}) => {
  const { language, t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert]);

  if (!alert) return null;

  const isRed = alert.severity === 'RED';
  const config = IMD_SEVERITY_CONFIG[alert.severity];

  const handleDismiss = () => {
    const key = generateAlertKey(alert);
    dismissAlert(key);
    onDismiss();
  };

  const handleViewAlert = () => {
    const key = generateAlertKey(alert);
    dismissAlert(key);
    onViewAlert(alert);
  };

  const handleAskWeatherGPT = () => {
    let question = `What does this ${alert.severity} ${alert.event} warning for ${alert.location} mean, and what immediate safety precautions should I take?`;
    if (language === 'hi') {
      question = `${alert.location} के लिए इस ${alert.severity} (${alert.event}) चेतावनी का क्या अर्थ है और मुझे क्या सुरक्षा कदम उठाने चाहिए?`;
    } else if (language === 'mr') {
      question = `${alert.location} साठी या ${alert.severity} (${alert.event}) इशार्‍याचा काय अर्थ आहे आणि मी कोणती सुरक्षितता खबरदारी घ्यावी?`;
    }
    onOpenChat(question);
  };

  const issuedFormatted = (() => {
    try {
      return new Date(alert.issuedAt).toLocaleString(
        getLanguageLocale(language),
        {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    } catch {
      return alert.issuedAt;
    }
  })();

  const validUntilFormatted = (() => {
    try {
      return new Date(alert.validUntil).toLocaleString(
        getLanguageLocale(language),
        {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    } catch {
      return alert.validUntil;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0e1834] shadow-2xl border-2 overflow-hidden animate-in zoom-in-95 duration-200 ${
          isRed ? 'border-red-500 ring-4 ring-red-500/10' : 'border-amber-500 ring-4 ring-amber-500/10'
        }`}
      >
        {/* Top Header Banner */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            isRed
              ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg">
              {config.icon}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-0.5">
                {alert.severity === 'RED' ? t.alerts.redAlert : t.alerts.orangeAlert}
              </span>
              <h3 className="text-base font-black tracking-tight leading-tight">
                {isRed ? t.alerts.immediateAction : t.alerts.bePrepared}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Event & Location */}
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {alert.event}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>{alert.location}</span>
              {alert.district && <span>• {alert.district} District</span>}
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b19] border border-slate-200/80 dark:border-indigo-500/20 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            {alert.description}
          </div>

          {/* Timestamp details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-y border-slate-100 dark:border-slate-800 py-3">
            <div>
              <span className="font-semibold text-slate-400 block uppercase text-[9px]">Issued</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{issuedFormatted}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-400 block uppercase text-[9px]">{t.alerts.validUntil}</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{validUntilFormatted}</span>
            </div>
            <div className="col-span-2 pt-1">
              <span className="font-semibold text-slate-400 block uppercase text-[9px]">Official Source</span>
              <span className="font-bold text-indigo-500 dark:text-indigo-400">{alert.source}</span>
            </div>
          </div>

          {/* Quick Safety Bullet Points */}
          {alert.safetyGuidance && alert.safetyGuidance.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Safety Checklist
              </span>
              <ul className="space-y-1">
                {alert.safetyGuidance.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleViewAlert}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{t.alerts.viewDetails}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleAskWeatherGPT}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.nav.askWeatherGPT}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              {t.alerts.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
