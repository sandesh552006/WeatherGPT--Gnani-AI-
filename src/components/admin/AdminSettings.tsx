'use client';

import React from 'react';
import {
  Settings,
  Sliders,
  Globe,
  Bot,
  CloudSun,
  Shield,
  Lock,
  Info,
} from 'lucide-react';

interface AdminSettingsProps {
  hasServiceKey?: boolean;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ hasServiceKey = false }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-sky-400" />
          <span>Platform Settings & Parameters</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          System operational configurations, active AI model flags, and environment variables status.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Configuration */}
        <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="h-4 w-4 text-sky-400" />
            <span>General Platform Parameters</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Platform Identity</p>
                <p className="text-[11px] text-slate-400">Application display title</p>
              </div>
              <span className="font-mono font-bold text-sky-400">WeatherGPT</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Default Region</p>
                <p className="text-[11px] text-slate-400">Initial coordinate grounding</p>
              </div>
              <span className="font-mono text-slate-300">New Delhi, India</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Multilingual System</p>
                <p className="text-[11px] text-slate-400">Supported regional languages</p>
              </div>
              <span className="font-mono text-slate-300">12 Languages</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Supabase Auth Synchronization</p>
                <p className="text-[11px] text-slate-400">auth.users server-side identity synchronization</p>
              </div>
              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                Active (Server-Side)
              </span>
            </div>
          </div>
        </div>

        {/* AI & Weather Configuration */}
        <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bot className="h-4 w-4 text-indigo-400" />
            <span>AI & Meteorological Integrations</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Conversational AI Engine</p>
                <p className="text-[11px] text-slate-400">Google Gemini API integration</p>
              </div>
              <span className="font-mono font-bold text-emerald-400">Gemini 1.5 Flash</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Live Voice Protocol</p>
                <p className="text-[11px] text-slate-400">Bidirectional PCM audio streaming</p>
              </div>
              <span className="font-mono text-slate-300">Gemini Live WS</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div>
                <p className="font-semibold text-slate-200">Primary Weather Data Provider</p>
                <p className="text-[11px] text-slate-400">Real-time hourly & daily forecasts</p>
              </div>
              <span className="font-mono text-slate-300">Open-Meteo + IMD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Security Warning Card */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-white">Immutable Server Configuration Guard</h4>
          <p className="text-slate-400 leading-relaxed">
            In accordance with platform security directives, sensitive environment variables (such as <code className="text-sky-300 font-mono">GEMINI_API_KEY</code> and database secrets) cannot be altered through browser controls. Any modification must be executed directly in the server host environment file (<code className="text-sky-300 font-mono">.env.local</code>) to prevent unauthorized takeover or injection.
          </p>
        </div>
      </div>
    </div>
  );
};
