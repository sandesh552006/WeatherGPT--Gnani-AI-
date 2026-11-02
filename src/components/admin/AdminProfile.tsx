'use client';

import React from 'react';
import {
  UserCheck,
  Shield,
  LogOut,
  ExternalLink,
  Mail,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminProfileProps {
  adminEmail: string;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ adminEmail }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-sky-400" />
          <span>Administrator Profile</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Active administrative identity, credential status, and platform authorization tier.
        </p>
      </div>

      {/* Main Admin Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0c1d35] via-[#091527] to-[#060e1a] border border-sky-500/30 p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-white">{adminEmail}</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500 text-white shadow-md">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verified Platform Administrator • Full Supervisory Privileges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>WeatherGPT App</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Authentication Provider</p>
            <p className="text-slate-200 font-semibold mt-1">Supabase Auth (SSR Cookies)</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Role Storage Layer</p>
            <p className="text-slate-200 font-semibold mt-1">public.user_roles (RLS Enforced)</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Session Health</p>
            <p className="text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active & Validated
            </p>
          </div>
        </div>
      </div>

      {/* Permissions List */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="h-4 w-4 text-sky-400" />
          <span>Assigned Supervisory Capabilities</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {[
            'Platform user directory oversight and role verification',
            'Live service diagnostics for Open-Meteo & Gemini Live',
            'Severe weather warning alert pipeline supervision',
            'Multilingual geocoding and forecast layer monitoring',
            'Row Level Security audit verification on user_roles',
            'Centralized system parameter and environment oversight',
          ].map((perm, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <span>{perm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
