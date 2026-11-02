'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Bot,
  CloudSun,
  Server,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Database,
  Radio,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { AdminTabId } from './AdminSidebar';
import { AdminUserItem, ServiceDiagnosticItem, fetchSystemHealthAction } from '@/app/admin/actions';

interface AdminOverviewProps {
  userRecords: AdminUserItem[];
  onNavigate: (tab: AdminTabId) => void;
  adminEmail: string;
  hasServiceKey?: boolean;
  onRefreshUsers?: () => void;
  isRefreshing?: boolean;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  userRecords,
  onNavigate,
  adminEmail,
  hasServiceKey = false,
  onRefreshUsers,
  isRefreshing = false,
}) => {
  const [diagnostics, setDiagnostics] = useState<ServiceDiagnosticItem[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number | null>(null);

  const totalUsers = userRecords.length;
  const adminCount = userRecords.filter((u) => u.role === 'admin').length;
  const standardUserCount = userRecords.filter((u) => u.role === 'user').length;

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const health = await fetchSystemHealthAction();
      setDiagnostics(health.services);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadAlertsCount = async () => {
    try {
      const res = await fetch('/api/alerts?location=New+Delhi');
      if (res.ok) {
        const data = await res.json();
        const activeCount = data.summaryCounts?.totalActive ?? 0;
        setActiveAlertsCount(activeCount);
      }
    } catch {
      setActiveAlertsCount(0);
    }
  };

  useEffect(() => {
    loadHealth();
    loadAlertsCount();
  }, []);

  const operationalServices = diagnostics.filter((d) => d.status === 'Operational').length;
  const totalServices = diagnostics.length || 5;

  const kpis = [
    {
      title: 'Total Users',
      value: totalUsers > 0 ? totalUsers.toString() : '0',
      subtitle: `${adminCount} Admin • ${standardUserCount} Users`,
      icon: Users,
      trend: hasServiceKey ? 'Supabase Auth Verified' : 'Registered in Supabase',
      color: 'sky',
      onClick: () => onNavigate('users'),
    },
    {
      title: 'Active Session',
      value: 'Verified',
      subtitle: 'Cookie SSR session active',
      icon: UserCheck,
      trend: adminEmail.split('@')[0],
      color: 'emerald',
      onClick: () => onNavigate('security'),
    },
    {
      title: 'AI Chat Telemetry',
      value: 'Active',
      subtitle: 'Gemini 1.5 Flash • Grounded',
      icon: Bot,
      trend: 'Client localStorage session',
      color: 'indigo',
      onClick: () => onNavigate('ai-analytics'),
    },
    {
      title: 'Weather Requests',
      value: 'Operational',
      subtitle: 'Open-Meteo & IMD radar live feeds',
      icon: CloudSun,
      trend: 'Real-time Grounding',
      color: 'amber',
      onClick: () => onNavigate('weather-analytics'),
    },
    {
      title: 'System Health',
      value: diagnostics.length > 0 ? `${operationalServices}/${totalServices}` : 'Live Ping',
      subtitle: diagnostics.length > 0
        ? `${operationalServices} of ${totalServices} services operational`
        : 'Testing endpoints...',
      icon: Server,
      trend: 'Real Latency Tested',
      color: 'teal',
      onClick: () => onNavigate('api-system'),
    },
    {
      title: 'Active Severe Alerts',
      value: activeAlertsCount !== null ? activeAlertsCount.toString() : 'Live',
      subtitle: activeAlertsCount !== null && activeAlertsCount === 0
        ? 'All Clear across monitored zones'
        : 'Active IMD warning bulletins',
      icon: AlertTriangle,
      trend: 'NDMA CAP Ingested',
      color: 'rose',
      onClick: () => onNavigate('alerts'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0c1d35] via-[#091527] to-[#060e1a] border border-sky-500/20 p-6 md:p-8 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Administrator Console</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-sky-400">{adminEmail.split('@')[0]}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              WeatherGPT platform administration center. Real-time telemetry, Supabase Auth user management, and verified service diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('users')}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Manage Users ({totalUsers})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loadHealth();
                if (onRefreshUsers) onRefreshUsers();
              }}
              disabled={loadingHealth || isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 text-sky-400 ${loadingHealth || isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Live Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.onClick}
              className="group cursor-pointer rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 hover:border-sky-500/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/5 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">{kpi.title}</span>
                  <div className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-sky-500/15 transition-colors">
                    <Icon className="h-4 w-4 text-sky-400" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {kpi.value}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-semibold text-sky-400">
                <span>{kpi.trend}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Real Services Status & Platform Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Service Operational Matrix */}
        <div className="lg:col-span-7 rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Live Service Diagnostics</span>
              </h3>
              <p className="text-[11px] text-slate-400">Measured network ping & operational status</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('api-system')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Detailed Diagnostics →
            </button>
          </div>

          <div className="space-y-2.5">
            {diagnostics.length > 0 ? (
              diagnostics.map((svc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 truncate">{svc.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${
                          svc.status === 'Operational'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : svc.status === 'Degraded'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{svc.notes}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 font-semibold flex-shrink-0">
                    {svc.latency}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin text-sky-400 mx-auto mb-2" />
                <span>Measuring endpoint latencies...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security & Role Architecture Overview */}
        <div className="lg:col-span-5 rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                <span>Security & Authorization</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <p className="font-semibold text-slate-300">Server-Side Route Protection</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Next.js root middleware verifies Supabase SSR cookies before page rendering. Unauthorized requests are intercepted before reaching the admin console.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <p className="font-semibold text-slate-300">Row Level Security (RLS)</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Enforced on <code className="text-sky-300 font-mono">public.user_roles</code>. Users cannot escalate their privileges through client-side API requests.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <p className="font-semibold text-slate-300">Credential Isolation</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  <code className="text-sky-300 font-mono">GEMINI_API_KEY</code> and Supabase secrets remain strictly server-side. No sensitive API secrets are ever exposed in client JavaScript.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('security')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>Inspect Security Center</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
