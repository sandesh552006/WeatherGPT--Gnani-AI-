'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { AdminUserItem } from '@/app/admin/actions';

interface AdminUsersProps {
  userRecords: AdminUserItem[];
  adminEmail: string;
  hasServiceKey?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  userRecords,
  adminEmail,
  hasServiceKey = false,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalUsers = userRecords.length;
  const adminCount = userRecords.filter((u) => u.role === 'admin').length;
  const userCount = userRecords.filter((u) => u.role === 'user').length;

  const filteredUsers = userRecords.filter((u) => {
    const matchesSearch =
      u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            <span>User Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered accounts from Supabase Auth and assigned authorization roles in <code className="text-sky-300 font-mono">public.user_roles</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Total Auth Users: <span className="font-bold text-white">{totalUsers}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-400">
            Admins: <span className="font-bold text-white">{adminCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Users: <span className="font-bold text-white">{userCount}</span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 ml-1"
              title="Refresh User List"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by User ID or Email..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#091527] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#091527] border border-slate-800 p-1 rounded-xl text-xs">
          {(['all', 'admin', 'user'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-colors ${
                roleFilter === r
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Account / User ID</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Email Verification</th>
                <th className="px-5 py-3.5">Registered / Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isCurrentAdmin = u.email === adminEmail;
                  return (
                    <tr key={u.user_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isAdmin ? 'A' : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                              {u.email || 'Supabase Auth User'}
                              {isCurrentAdmin && (
                                <span className="text-[9px] font-bold text-sky-400 bg-sky-500/15 px-1.5 py-0.2 rounded border border-sky-500/30">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-xs">
                              {u.user_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isAdmin && <Shield className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Unconfirmed
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Active'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(u.user_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 text-[11px]"
                          title="Copy User UUID"
                        >
                          {copiedId === u.user_id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Copy UID</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No matching user records found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or role filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administrative Role Management Guide */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-sky-500/20 p-5">
        <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-sky-400" />
          <span>Secure Role Assignment Policy</span>
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          For security compliance, user promotion to <span className="text-sky-300 font-semibold">ADMIN</span> is strictly restricted to server-side SQL execution. New signups automatically register as standard <span className="text-slate-300 font-semibold">USER</span>.
        </p>

        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
          <p className="text-slate-500 mb-1">-- SQL to promote an existing account in Supabase Dashboard:</p>
          <p className="text-sky-300">
            UPDATE public.user_roles SET role = &apos;admin&apos; WHERE user_id = (SELECT id FROM auth.users WHERE email = &apos;user@example.com&apos;);
          </p>
        </div>
      </div>
    </div>
  );
};
