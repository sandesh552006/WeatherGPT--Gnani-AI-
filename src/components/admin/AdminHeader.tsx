'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Shield,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  Info,
  Check,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminNotificationItem, fetchAdminNotificationsAction } from '@/app/admin/actions';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  onOpenMobile: () => void;
  adminEmail: string;
  onNavigate?: (tab: string) => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

const READ_NOTIFS_KEY = 'weathergpt_admin_read_notifs_v1';

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onOpenMobile,
  adminEmail,
  onNavigate,
  onRefreshData,
  isRefreshing = false,
}) => {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_NOTIFS_KEY);
      if (raw) {
        setReadIds(JSON.parse(raw));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch real admin notifications on mount
  useEffect(() => {
    let isMounted = true;
    const loadNotifs = async () => {
      setLoadingNotifs(true);
      try {
        const notifs = await fetchAdminNotificationsAction();
        if (isMounted) {
          setNotifications(notifs);
        }
      } catch (err) {
        console.error('Failed to load admin notifications:', err);
      } finally {
        if (isMounted) setLoadingNotifs(false);
      }
    };
    loadNotifs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(allIds));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const displayedNotifications = notifications.filter((n) => {
    const isRead = readIds.includes(n.id);
    if (filter === 'unread') return !isRead;
    return true;
  });

  const handleNotificationClick = (notif: AdminNotificationItem) => {
    markAsRead(notif.id);
    if (notif.linkTab && onNavigate) {
      onNavigate(notif.linkTab);
      setShowNotifications(false);
    }
  };

  const getSeverityBadge = (type: string, severity?: string) => {
    if (severity === 'critical') {
      return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
    }
    if (severity === 'warning') {
      return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">WARNING</span>;
    }
    if (severity === 'success') {
      return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PASSING</span>;
    }
    return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">INFO</span>;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4 text-sky-400" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'security':
        return <Shield className="h-4 w-4 text-emerald-400" />;
      default:
        return <Info className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <header className="h-16 px-6 border-b border-slate-800/80 bg-[#07111e]/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Operational Status, Refresh, Notifications & Profile */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* Refresh Live Data Button */}
        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        )}

        {/* Notifications Icon Button & Dropdown Container */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-xl transition-colors ${
              showNotifications
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Notification Center"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-[#07111e] shadow-sm animate-in zoom-in-50">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#091527] border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-4 pt-2.5 pb-2 border-b border-slate-800/80 flex items-center gap-1.5 text-xs bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    filter === 'all'
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    filter === 'unread'
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {loadingNotifs ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin text-sky-400 mx-auto mb-2" />
                    <span>Loading notifications...</span>
                  </div>
                ) : displayedNotifications.length > 0 ? (
                  displayedNotifications.map((notif) => {
                    const isRead = readIds.includes(notif.id);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          isRead
                            ? 'hover:bg-slate-800/40 bg-transparent'
                            : 'bg-sky-500/5 hover:bg-sky-500/10'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-slate-800/80 flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate ${isRead ? 'text-slate-300' : 'text-white'}`}>
                              {notif.title}
                            </span>
                            {getSeverityBadge(notif.type, notif.severity)}
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>{notif.timestamp}</span>
                            {!isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" title="Unread" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400/60 mx-auto" />
                    <p className="text-xs font-bold text-slate-200">No notifications</p>
                    <p className="text-[11px] text-slate-400">
                      {filter === 'unread' ? 'All caught up! No unread events.' : 'System running smoothly.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center text-[10px] text-slate-500 flex items-center justify-between px-4">
                <span>Real WeatherGPT Events</span>
                <span className="text-sky-400/80">Click event to inspect</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick App Link */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <span>WeatherGPT App</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30">
          <Shield className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10px] font-bold text-sky-300 tracking-wider">ADMIN</span>
        </div>
      </div>
    </header>
  );
};
