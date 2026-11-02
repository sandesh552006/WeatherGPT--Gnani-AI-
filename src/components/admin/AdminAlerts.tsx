'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Radio,
  Clock,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RefreshCw,
  Shield,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AlertItem {
  id: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  event: string;
  category: string;
  location: string;
  district?: string;
  state?: string;
  description: string;
  issuedAt: string;
  source: string;
}

export const AdminAlerts: React.FC = () => {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ redCount: 0, orangeCount: 0, yellowCount: 0, totalActive: 0 });
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts?location=New+Delhi&refresh=true');
      if (res.ok) {
        const data = await res.json();
        const allAlerts: AlertItem[] = [
          ...(data.locationAlerts || []),
          ...(data.allIndiaAlerts || []),
        ];
        // Deduplicate by ID
        const uniqueMap = new Map<string, AlertItem>();
        allAlerts.forEach((a) => uniqueMap.set(a.id, a));
        const deduped = Array.from(uniqueMap.values());

        setAlerts(deduped);
        setSummary({
          redCount: data.summaryCounts?.redCount ?? 0,
          orangeCount: data.summaryCounts?.orangeCount ?? 0,
          yellowCount: data.summaryCounts?.yellowCount ?? 0,
          totalActive: data.summaryCounts?.totalActive ?? 0,
        });
        setLastRefreshed(data.updatedAt || new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load alerts in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const alertSeverities = [
    {
      level: 'CRITICAL (Red)',
      color: 'rose',
      count: `${summary.redCount} Active`,
      desc: 'Severe convective activity, cyclone or flash flood risk',
    },
    {
      level: 'HIGH (Orange)',
      color: 'amber',
      count: `${summary.orangeCount} Active`,
      desc: 'Heavy rainfall or extreme heat advisories (Be Prepared)',
    },
    {
      level: 'MODERATE (Yellow)',
      color: 'yellow',
      count: `${summary.yellowCount} Active`,
      desc: 'Localized thunderstorms and high winds (Be Updated)',
    },
    {
      level: 'NORMAL (Green)',
      color: 'emerald',
      count: summary.totalActive === 0 ? 'All Clear' : 'Monitoring',
      desc: 'No severe warnings affecting monitored zones',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>Severe Weather Alerts Control Surface</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative IMD automated bulletins, meteorological severity classifications, and emergency banner status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadAlerts}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Alerts'}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-colors flex items-center gap-2"
          >
            <span>Public Alerts Map</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Severity Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertSeverities.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">{item.level}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  {item.count}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-[11px]">NDMA Sachet Synced</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Bulletins Stream or Empty State */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Active Meteorological Bulletins</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {alerts.length} Ingested
            </span>
          </div>

          {lastRefreshed && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Updated: {lastRefreshed}</span>
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-800/60">
          {alerts.length > 0 ? (
            alerts.slice(0, 10).map((a) => {
              const isRed = a.severity === 'RED';
              const isOrange = a.severity === 'ORANGE';
              return (
                <div key={a.id} className="p-4 hover:bg-slate-800/20 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isRed
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : isOrange
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        }`}
                      >
                        {a.severity}
                      </span>
                      <span className="text-xs font-bold text-white">{a.event}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{a.source}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{a.description}</p>

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-400" />
                      <span>{a.location}</span>
                    </span>
                    <span>
                      Issued: {new Date(a.issuedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">No active severe alerts detected</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Atmospheric conditions across monitored regions are currently benign. IMD bulletins and NDMA CAP warnings will automatically render here when issued.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Alert Pipeline Status */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-sky-400" />
          <span>Automated Bulletin Dispatch Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="font-semibold text-slate-200">5-Minute Polling Loop</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Active clients query <code className="text-sky-300 font-mono">/api/alerts</code> every 5 minutes with coordinate bounds to refresh location-specific advisories.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="font-semibold text-slate-200">Emergency Modal Triggers</p>
            <p className="text-[11px] text-slate-400 mt-1">
              RED and ORANGE warnings automatically trigger the persistent global <code className="text-sky-300 font-mono">AlertPopup</code> modal in the dashboard until dismissed.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="font-semibold text-slate-200">Authoritative Grounding</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Bulletins are ingested directly from official India Meteorological Department (IMD) feeds with meteorological provenance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
