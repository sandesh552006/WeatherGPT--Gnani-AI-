'use client';

import React from 'react';
import {
  Sprout,
  Plane,
  Anchor,
  ShieldAlert,
  HeartPulse,
  Building2,
  Truck,
  Zap,
  Radio,
} from 'lucide-react';
import { SectorId } from '@/lib/sectoral/types';
import { SECTOR_CATALOG } from '@/lib/sectoral/rules';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface SectorSelectorProps {
  selectedSector: SectorId;
  onSelectSector: (id: SectorId) => void;
  locationName: string;
}

export const SectorSelector: React.FC<SectorSelectorProps> = ({
  selectedSector,
  onSelectSector,
  locationName,
}) => {
  const { t } = useTranslation();
  const getIcon = (iconName: string, isActive: boolean) => {
    const className = `h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`;
    switch (iconName) {
      case 'Sprout':
        return <Sprout className={className} />;
      case 'Plane':
        return <Plane className={className} />;
      case 'Anchor':
        return <Anchor className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'HeartPulse':
        return <HeartPulse className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      case 'Truck':
        return <Truck className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      default:
        return <Sprout className={className} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>{t.sectoral.domainsTitle}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.sectoral.chooseSector}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
            {t.sectoral.chooseSectorDesc.replace('{location}', locationName)}
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] text-slate-400 font-medium">
            Active Model: Agro-Met WRF-NCMRWF & IMD Guidelines
          </span>
        </div>
      </div>

      {/* 8-Card Grid (2 rows x 4 columns on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECTOR_CATALOG.map((sec) => {
          const isActive = selectedSector === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => onSelectSector(sec.id)}
              className={`text-left p-5 rounded-3xl border transition-all duration-200 relative flex flex-col justify-between h-44 group ${
                isActive
                  ? 'bg-white dark:bg-[#0e1834] border-indigo-500 dark:border-indigo-400 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-[#0e1834]/60 hover:bg-slate-50/80 dark:hover:bg-[#0e1834] border-slate-200/80 dark:border-indigo-500/15 shadow-sm hover:border-slate-300 dark:hover:border-indigo-500/30'
              }`}
            >
              {/* Top Row: Icon + Tag */}
              <div className="flex items-start justify-between w-full">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40'
                      : 'bg-slate-100 dark:bg-[#070b19] border border-slate-200 dark:border-indigo-500/20'
                  }`}
                >
                  {getIcon(sec.iconName, isActive)}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                  {sec.tag}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {(t.sectoral as Record<string, string>)[sec.id] || sec.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {sec.description}
                </p>
              </div>

              {/* Bottom active pill indicator */}
              <div
                className={`w-full h-1 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
