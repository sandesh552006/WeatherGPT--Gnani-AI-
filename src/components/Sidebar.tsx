'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  SunMedium,
  Compass,
  AlertTriangle,
  Briefcase,
  Globe,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileLangMenuOpen, setIsMobileLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weathergpt_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {}
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangMenuOpen]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('weathergpt_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Exactly 7 core feature navigation items (Saved Locations and History removed as requested)
  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard || 'Home', icon: LayoutDashboard },
    { id: 'forecast', label: t.nav.forecast || 'Forecast', icon: SunMedium },
    { id: 'maps', label: t.nav.maps || 'Maps', icon: Compass },
    { id: 'ask-weathergpt', label: t.nav.askWeatherGPT || 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'alerts', label: t.nav.alerts || 'Weather Alerts', icon: AlertTriangle },
    { id: 'sectoral', label: t.nav.sectoral || 'Sectoral Advice', icon: Briefcase },
    { id: 'climate', label: t.nav.climate || 'Climate & History', icon: Globe },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile?.();
  };

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white/90 dark:bg-[#070b19] border-r border-slate-200/80 dark:border-indigo-500/20 backdrop-blur-xl transition-all duration-300 z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top: Brand Header & Main Navigation */}
        <div className="p-4 sm:p-5">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-indigo-600/30 flex items-center justify-center">
                <div className="h-full w-full bg-[#070b19] rounded-[10px] flex items-center justify-center">
                  <span className="text-xl">🌤️</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-indigo-600/30 flex-shrink-0 flex items-center justify-center">
                  <div className="h-full w-full bg-[#070b19] rounded-[10px] flex items-center justify-center">
                    <span className="text-xl">🌤️</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                      WeatherGPT
                    </h1>
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    Your Personal Weather Assistant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 ml-1"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation Items (Cleaned up, perfectly spaced) */}
          <nav className={`mt-6 space-y-1.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group w-full flex justify-center py-0.5">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                          : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'currentColor'}`} />
                      {item.badge && !isActive && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#070b19]" />
                      )}
                    </button>

                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700/60">
                      {item.label}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Compact Sleek Language Dropdown */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
          <div className="relative" ref={langMenuRef}>
            {isCollapsed ? (
              <div className="relative flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen((prev) => !prev)}
                  className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#0c142c] border border-slate-200/80 dark:border-indigo-500/25 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-all shadow-xs"
                  title={`Language: ${currentLang.nativeName}`}
                >
                  <Globe className="h-4 w-4 text-indigo-500" />
                </button>

                {/* Collapsed Popover Menu */}
                {isLangMenuOpen && (
                  <div className="absolute left-full ml-3 bottom-0 w-56 p-1.5 rounded-2xl bg-white dark:bg-[#0c142c] border border-slate-200 dark:border-indigo-500/30 shadow-2xl shadow-indigo-950/40 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                      Select Language
                    </div>
                    <div className="space-y-0.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.code);
                              setIsLangMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm">{lang.flag}</span>
                              <span className="truncate">{lang.nativeName}</span>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5 px-1">
                  Language / भाषा
                </label>
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0c142c] hover:bg-slate-100 dark:hover:bg-[#121c3d] border border-slate-200/80 dark:border-indigo-500/25 transition-all text-xs font-semibold shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Globe className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm">{currentLang.flag}</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate font-semibold">
                      {currentLang.nativeName}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      isLangMenuOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu (Opens cleanly upward) */}
                {isLangMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 rounded-2xl bg-white dark:bg-[#0c142c] border border-slate-200 dark:border-indigo-500/30 shadow-2xl shadow-indigo-950/40 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                      Choose Language
                    </div>
                    <div className="space-y-0.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.code);
                              setIsLangMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="text-sm">{lang.flag}</span>
                              <span className="truncate font-semibold">{lang.nativeName}</span>
                              <span
                                className={`text-[10px] ${
                                  isSelected ? 'text-indigo-200' : 'text-slate-400'
                                }`}
                              >
                                ({lang.label})
                              </span>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#070b19] text-slate-700 dark:text-slate-300 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-250 border-r border-slate-200 dark:border-indigo-500/20 select-none overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
                    <div className="h-full w-full bg-[#070b19] rounded-[10px] flex items-center justify-center">
                      <span className="text-xl">🌤️</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                        WeatherGPT
                      </h1>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Your Personal Weather Assistant
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close Navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="mt-6 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && !isActive && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Language Selector Dropdown */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 px-1">
                  Language / भाषा
                </label>
                <button
                  type="button"
                  onClick={() => setIsMobileLangMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0c142c] border border-slate-200/80 dark:border-indigo-500/25 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm">{currentLang.flag}</span>
                    <span>{currentLang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({currentLang.label})</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      isMobileLangMenuOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {isMobileLangMenuOpen && (
                  <div className="mt-2 p-1.5 rounded-2xl bg-white dark:bg-[#0c142c] border border-slate-200 dark:border-indigo-500/30 shadow-lg space-y-0.5 max-h-56 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsMobileLangMenuOpen(false);
                            onCloseMobile?.();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">{lang.flag}</span>
                            <span className="truncate">{lang.nativeName}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              ({lang.label})
                            </span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
