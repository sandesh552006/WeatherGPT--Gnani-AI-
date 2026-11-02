'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { WeatherAlert, IMD_SEVERITY_CONFIG } from '@/lib/alertTypes';
import { getSeenAlerts, markAlertSeen, generateAlertKey } from '@/lib/alertEngine';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface AlertNotificationCenterProps {
  alerts: WeatherAlert[];
  onSelectAlert: (alert: WeatherAlert) => void;
  onNavigateToAlerts?: () => void;
}

export const AlertNotificationCenter: React.FC<AlertNotificationCenterProps> = ({
  alerts,
  onSelectAlert,
  onNavigateToAlerts,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [seenKeys, setSeenKeys] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeenKeys(getSeenAlerts());
  }, [alerts]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadAlerts = alerts.filter((a) => !seenKeys.includes(generateAlertKey(a)));
  const unreadCount = unreadAlerts.length;

  const handleMarkAllAsRead = () => {
    alerts.forEach((a) => {
      markAlertSeen(generateAlertKey(a));
    });
    setSeenKeys(getSeenAlerts());
  };

  const handleAlertClick = (alert: WeatherAlert) => {
    markAlertSeen(generateAlertKey(alert));
    setSeenKeys(getSeenAlerts());
    setIsOpen(false);
    onSelectAlert(alert);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#0e1834] dark:hover:bg-[#162550] border border-slate-200/90 dark:border-indigo-500/20 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
        title="Weather Alert Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] px-1 rounded-full bg-rose-600 text-white font-extrabold text-[9px] sm:text-[10px] flex items-center justify-center border-2 border-white dark:border-[#070b19] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0e1834] p-4 shadow-2xl border border-slate-200/90 dark:border-indigo-500/25 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white">{t.alerts.activeAlerts}</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
                  {unreadCount} {t.notifications.newBadge}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                <span>{t.notifications.markAllRead}</span>
              </button>
            )}
          </div>

          {/* List of Alerts */}
          {alerts.length > 0 ? (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {alerts.slice(0, 8).map((alert) => {
                const key = generateAlertKey(alert);
                const isUnread = !seenKeys.includes(key);
                const config = IMD_SEVERITY_CONFIG[alert.severity];

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isUnread
                        ? 'bg-blue-50/60 dark:bg-indigo-950/40 border-blue-200 dark:border-indigo-500/40 hover:bg-blue-50 dark:hover:bg-indigo-900/50'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{config.icon}</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${config.badgeBg} ${config.badgeText}`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[170px]">
                          {alert.event}
                        </span>
                      </div>
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-indigo-400" />}
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">{alert.location}</div>

                    <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>{t.notifications.source}: {alert.source.split('/')[0]?.trim()}</span>
                      <span className="text-blue-600 dark:text-indigo-400 font-semibold">{t.alerts.viewDetails}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="text-2xl mb-1">🟢</div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.alerts.greenAlert}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.alerts.noAlerts}</p>
            </div>
          )}

          {/* Footer link to full Alerts & Warnings page */}
          {onNavigateToAlerts && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToAlerts();
                }}
                className="text-xs font-bold text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 flex items-center justify-center gap-1 w-full"
              >
                <span>{t.notifications.openDashboard}</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
