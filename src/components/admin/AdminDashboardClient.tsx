'use client';

import React, { useState } from 'react';
import { AdminSidebar, AdminTabId } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { WeatherAnalytics } from './WeatherAnalytics';
import { AIAnalytics } from './AIAnalytics';
import { AdminAlerts } from './AdminAlerts';
import { AnalyticsCharts } from './AnalyticsCharts';
import { SystemHealth } from './SystemHealth';
import { SecurityPanel } from './SecurityPanel';
import { AdminSettings } from './AdminSettings';
import { AdminProfile } from './AdminProfile';
import { AdminUserItem, fetchAdminUsersAction } from '@/app/admin/actions';

interface AdminDashboardClientProps {
  adminEmail: string;
  userRecords: AdminUserItem[];
  hasServiceKey?: boolean;
}

export const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({
  adminEmail,
  userRecords: initialUserRecords,
  hasServiceKey = false,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [users, setUsers] = useState<AdminUserItem[]>(initialUserRecords);
  const [serviceKeyConfigured, setServiceKeyConfigured] = useState(hasServiceKey);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      const res = await fetchAdminUsersAction();
      if (res.success) {
        setUsers(res.users);
        setServiceKeyConfigured(res.hasServiceKey);
      }
    } catch (err) {
      console.error('Failed to refresh admin users:', err);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const getTabMeta = (tab: AdminTabId) => {
    switch (tab) {
      case 'overview':
        return {
          title: 'System Overview',
          subtitle: 'Operational control center and key platform indicators',
        };
      case 'users':
        return {
          title: 'User Management',
          subtitle: 'Supabase Auth registered accounts & authorization auditing',
        };
      case 'weather-analytics':
        return {
          title: 'Weather Analytics',
          subtitle: 'Meteorological telemetry and grounding metrics',
        };
      case 'ai-analytics':
        return {
          title: 'Ask WeatherGPT Analytics',
          subtitle: 'Gemini conversational queries and voice telemetry',
        };
      case 'alerts':
        return {
          title: 'Severe Alerts Control',
          subtitle: 'IMD official meteorological bulletins and warnings',
        };
      case 'analytics':
        return {
          title: 'Platform Analytics',
          subtitle: 'Historical usage trends and module distribution',
        };
      case 'api-system':
        return {
          title: 'API & Microservices',
          subtitle: 'Live health status of external engines and APIs',
        };
      case 'security':
        return {
          title: 'Security Posture',
          subtitle: 'Row Level Security, cookie sessions, and RBAC compliance',
        };
      case 'settings':
        return {
          title: 'Platform Settings',
          subtitle: 'Core application parameters and runtime environment',
        };
      case 'profile':
        return {
          title: 'Administrator Profile',
          subtitle: 'Current supervisory identity and access tier',
        };
      default:
        return {
          title: 'Admin Console',
          subtitle: 'WeatherGPT Administration',
        };
    }
  };

  const { title, subtitle } = getTabMeta(activeTab);

  return (
    <div className="flex h-screen bg-[#050c16] text-slate-100 overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        adminEmail={adminEmail}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          onOpenMobile={() => setMobileOpen(true)}
          adminEmail={adminEmail}
          onNavigate={(tab) => setActiveTab(tab as AdminTabId)}
          onRefreshData={handleRefreshUsers}
          isRefreshing={isRefreshingUsers}
        />

        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <AdminOverview
              userRecords={users}
              onNavigate={setActiveTab}
              adminEmail={adminEmail}
              hasServiceKey={serviceKeyConfigured}
              onRefreshUsers={handleRefreshUsers}
              isRefreshing={isRefreshingUsers}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsers
              userRecords={users}
              adminEmail={adminEmail}
              hasServiceKey={serviceKeyConfigured}
              onRefresh={handleRefreshUsers}
              isRefreshing={isRefreshingUsers}
            />
          )}

          {activeTab === 'weather-analytics' && <WeatherAnalytics />}

          {activeTab === 'ai-analytics' && <AIAnalytics />}

          {activeTab === 'alerts' && <AdminAlerts />}

          {activeTab === 'analytics' && <AnalyticsCharts />}

          {activeTab === 'api-system' && <SystemHealth />}

          {activeTab === 'security' && <SecurityPanel adminEmail={adminEmail} />}

          {activeTab === 'settings' && <AdminSettings hasServiceKey={serviceKeyConfigured} />}

          {activeTab === 'profile' && <AdminProfile adminEmail={adminEmail} />}
        </main>
      </div>
    </div>
  );
};
