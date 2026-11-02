'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { ServiceDiagnosticItem, fetchSystemHealthAction } from '@/app/admin/actions';

export const SystemHealth: React.FC = () => {
  const [services, setServices] = useState<ServiceDiagnosticItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await fetchSystemHealthAction();
      setServices(result.services);
      setLastChecked(result.checkedAt);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const passingCount = services.filter((s) => s.status === 'Operational').length;
  const totalCount = services.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="h-5 w-5 text-sky-400" />
            <span>API & System Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live network verification of backend integrations, APIs, and database connectivity.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {totalCount > 0 && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                passingCount === totalCount
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/50 border-amber-500/30 text-amber-400'
              }`}
            >
              {passingCount === totalCount ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              <span>
                {passingCount} of {totalCount} Services Passing
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={runDiagnostics}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Testing...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Critical Platform Microservices</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Real roundtrip latencies measured from server to endpoint</p>
          </div>
          {lastChecked && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Checked: {lastChecked}</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-800/60">
          {loading && services.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-sky-400 mx-auto" />
              <p>Executing live endpoint diagnostics...</p>
            </div>
          ) : services.length > 0 ? (
            services.map((svc, i) => {
              const isOp = svc.status === 'Operational';
              const isDeg = svc.status === 'Degraded';
              return (
                <div
                  key={i}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{svc.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isOp
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : isDeg
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}
                      >
                        {isOp ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : isDeg ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span>{svc.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{svc.endpoint}</p>
                    <p className="text-[11px] text-slate-400">{svc.notes}</p>
                  </div>

                  <div className="flex items-center gap-6 text-xs flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Service Type
                      </p>
                      <p className="text-slate-300 font-medium">{svc.type}</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Latency
                      </p>
                      <p
                        className={`font-mono font-bold ${
                          isOp
                            ? 'text-emerald-400'
                            : isDeg
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {svc.latency}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              <p>No diagnostic results yet. Click &quot;Run Diagnostics&quot; above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Isolation Notice */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex-shrink-0">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-white">Credential & API Key Isolation Standard</h4>
          <p className="text-slate-400 leading-relaxed">
            In compliance with WeatherGPT production security directives, private API keys (including <code className="text-sky-300 font-mono">GEMINI_API_KEY</code> and Supabase service credentials) are strictly retained inside the Node.js server environment and are never rendered into browser HTML or client JavaScript.
          </p>
        </div>
      </div>
    </div>
  );
};
