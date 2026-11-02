'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  CloudSun,
  Bot,
  AlertTriangle,
  LineChart,
  Server,
  ShieldCheck,
  Settings,
  UserCheck,
  LogOut,
  ExternalLink,
  X,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export type AdminTabId =
  | 'overview'
  | 'users'
  | 'weather-analytics'
  | 'ai-analytics'
  | 'alerts'
  | 'analytics'
  | 'api-system'
  | 'security'
  | 'settings'
  | 'profile';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  setActiveTab: (tab: AdminTabId) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  adminEmail: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  adminEmail,
}) => {
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

  const navItems = [
    { id: 'overview' as AdminTabId, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'users' as AdminTabId, label: 'Users', icon: Users, badge: null },
    { id: 'weather-analytics' as AdminTabId, label: 'Weather Analytics', icon: CloudSun, badge: null },
    { id: 'ai-analytics' as AdminTabId, label: 'AI Analytics', icon: Bot, badge: 'AI' },
    { id: 'alerts' as AdminTabId, label: 'Alerts', icon: AlertTriangle, badge: null },
    { id: 'analytics' as AdminTabId, label: 'Analytics', icon: LineChart, badge: null },
    { id: 'api-system' as AdminTabId, label: 'API & System', icon: Server, badge: 'Health' },
    { id: 'security' as AdminTabId, label: 'Security', icon: ShieldCheck, badge: null },
    { id: 'settings' as AdminTabId, label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-[#07111e] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/weathergpt-logo.jpg"
                alt="WeatherGPT Logo"
                className="h-9 w-9 object-contain rounded-xl shadow-md shadow-sky-500/20 border border-sky-500/30"
              />
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  Weather<span className="text-sky-400">GPT</span>
                </h1>
                <p className="text-[10px] font-semibold text-sky-400/90 tracking-widest uppercase">
                  Admin Console
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-7 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Platform Administration
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Profile & Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-[#050c16]/50 space-y-2">
          {/* Admin Profile Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-white border border-sky-500/40'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{adminEmail}</p>
                <span className="text-[9px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.2 rounded">
                  ADMIN
                </span>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
          </button>

          {/* Return to WeatherGPT App */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Open WeatherGPT App</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
