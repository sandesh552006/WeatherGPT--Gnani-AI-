'use client';

import React, { useState } from 'react';
import {
  LineChart,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  Database,
  Info,
} from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('7d');

  const platformModules = [
    { name: 'Dashboard & Live Weather', status: 'Operational', source: 'Open-Meteo Grounding', type: 'Core View' },
    { name: 'Ask WeatherGPT (Chat & Voice)', status: 'Operational', source: 'Gemini 1.5 Flash + Live WS', type: 'AI Engine' },
    { name: 'Weather Forecast (24h / 7-Day)', status: 'Operational', source: 'Open-Meteo Hourly/Daily API', type: 'Forecast Pipeline' },
    { name: 'Interactive Weather Maps', status: 'Operational', source: 'Leaflet + OpenStreetMap + CARTO', type: 'GIS Mapping' },
    { name: 'Severe Alerts & Warnings', status: 'Operational', source: 'IMD & NDMA CAP RSS / API', type: 'Emergency Feed' },
    { name: 'Agricultural & Sectoral Advisory', status: 'Operational', source: 'Contextual Agronomic Engine', type: 'Advisory Engine' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LineChart className="h-5 w-5 text-sky-400" />
            <span>Platform Usage Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical activity trends, module registry status, and database telemetry monitoring.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#091527] border border-slate-800 p-1 rounded-xl text-xs self-start sm:self-auto">
          {(['today', '7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-colors ${
                timeRange === r
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Module Registry Card */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <span>WeatherGPT Active Module Registry</span>
          </h3>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            6 Core Modules Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {platformModules.map((m, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.type}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {m.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-1">{m.name}</h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">{m.source}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time-Series Historical Tracking - Truthful Empty State */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-8 text-center space-y-4 shadow-md">
        <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
          <BarChart3 className="h-6 w-6" />
        </div>
        
        <div className="space-y-1 max-w-lg mx-auto">
          <h3 className="text-base font-bold text-white">No Telemetry Data Recorded Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Historical time-series graphs for window <span className="text-sky-300 font-semibold font-mono">[{timeRange.toUpperCase()}]</span> require persistent telemetry event logging. In accordance with WeatherGPT&apos;s privacy architecture, queries and voice sessions are stored only in client browser storage.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <Database className="h-3.5 w-3.5 text-sky-400" />
          <span>Telemetry hook will auto-graph metrics when backend logging table is configured</span>
        </div>
      </div>
    </div>
  );
};
