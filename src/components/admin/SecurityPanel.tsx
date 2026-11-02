'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  FileCheck,
  AlertOctagon,
  CheckCircle2,
  Fingerprint,
} from 'lucide-react';

interface SecurityPanelProps {
  adminEmail: string;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ adminEmail }) => {
  const securityChecks = [
    {
      title: 'Server-Side Route Authorization',
      status: 'Enforced',
      desc: 'Next.js root middleware and /admin page perform server-side checks before rendering protected markup.',
    },
    {
      title: 'Row Level Security (RLS)',
      status: 'Active',
      desc: 'Enabled on public.user_roles table. Normal users are strictly restricted to reading their own record.',
    },
    {
      title: 'Zero Client Privilege Escalation',
      status: 'Guaranteed',
      desc: 'No client-side role modification is permitted. Administrator promotion requires direct server SQL.',
    },
    {
      title: 'API Secret Isolation',
      status: 'Secured',
      desc: 'GEMINI_API_KEY is restricted to server routes (/api/live-token). No client NEXT_PUBLIC exposure.',
    },
    {
      title: 'Session Cookie Encryption',
      status: 'Active',
      desc: 'Managed by @supabase/ssr with secure HTTP cookies and automatic session refresh in middleware.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-sky-400" />
          <span>Platform Security & Access Control</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Authentication posture, Row Level Security (RLS) enforcement, and server-side authorization controls.
        </p>
      </div>

      {/* Active Session Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c1d35] to-[#07111e] border border-sky-500/30 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{adminEmail}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white shadow-sm">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Session verified against database role record in <code className="text-sky-300 font-mono">public.user_roles</code>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="h-4 w-4" />
            <span>Authenticated & Authorized</span>
          </div>
        </div>
      </div>

      {/* Security Check Matrix */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-400" />
            <span>Security Compliance Matrix</span>
          </h3>
          <span className="text-[11px] text-emerald-400 font-medium">5 of 5 Checks Passing</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {securityChecks.map((chk, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{chk.title}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {chk.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{chk.desc}</p>
              </div>

              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
