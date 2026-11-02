import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  MapPin,
  ChevronDown,
  Sparkles,
  User,
  Check,
  ArrowRight,
  LogOut,
  LocateFixed,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/supabase/auth-helpers';
import { GeoLocation } from '@/lib/types';
import { WeatherAlert } from '@/lib/alertTypes';
import { SectorId } from '@/lib/sectoral/types';
import { AlertNotificationCenter } from './AlertNotificationCenter';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { searchDestinations, SearchDestination } from '@/lib/search/destinations';
import {
  getLocalizedLocationName,
  getLocalizedCountry,
  getLocalizedAdmin1,
  searchMultilingualLocations,
  getEnglishQueryForGeocoding,
  POPULAR_LOCATIONS,
} from '@/lib/i18n/locations';

interface TopNavProps {
  currentLocation: GeoLocation;
  onLocationChange: (loc: GeoLocation) => void;
  onQuickAsk: (question: string) => void;
  onNavigate?: (tab: string, sector?: SectorId) => void;
  onUseCurrentLocation?: () => Promise<void> | void;
  isLocatingCurrent?: boolean;
  locationError?: string | null;
  alerts?: WeatherAlert[];
  onSelectAlert?: (alert: WeatherAlert) => void;
  onNavigateToAlerts?: () => void;
  onOpenMobileNav?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentLocation,
  onLocationChange,
  onQuickAsk,
  onNavigate,
  onUseCurrentLocation,
  isLocatingCurrent = false,
  locationError,
  alerts,
  onSelectAlert,
  onNavigateToAlerts,
  onOpenMobileNav,
}) => {
  const { language, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const locationPickerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<{ email?: string; id?: string } | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Fetch Supabase user session & verified role on mount
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser({ email: data.user.email, id: data.user.id });
          getUserRole(supabase, data.user.id).then((role) => {
            setUserRole(role);
          });
        }
      });
    } catch (e) {
      console.warn('Unable to load auth session in TopNav:', e);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      try {
        localStorage.removeItem('weathergpt_active_conversation_id');
        if (currentUser?.id) {
          localStorage.removeItem(`weathergpt_active_conv_${currentUser.id}`);
        }
      } catch {}
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  // Live matching destinations based on query & language
  const matchingDestinations: SearchDestination[] = React.useMemo(() => {
    if (!searchInput.trim()) return [];
    return searchDestinations(searchInput, language);
  }, [searchInput, language]);

  // Click outside to close suggestion, location, and profile popups
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (locationPickerRef.current && !locationPickerRef.current.contains(e.target as Node)) {
        setShowLocationPicker(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDestination = (dest: SearchDestination) => {
    setShowSuggestions(false);
    setSearchInput('');
    if (onNavigate) {
      onNavigate(dest.tabId, dest.sectorId);
    } else {
      if (dest.tabId === 'alerts' && onNavigateToAlerts) {
        onNavigateToAlerts();
      } else if (dest.tabId === 'ask-weathergpt') {
        onQuickAsk('');
      }
    }
  };

  const handleAskWeatherGPTDirect = (query: string) => {
    setShowSuggestions(false);
    setSearchInput('');
    onQuickAsk(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && searchInput.trim().length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowSuggestions(true);
      }
    }

    const totalItems = matchingDestinations.length + (searchInput.trim() ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 >= totalItems ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 < 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < matchingDestinations.length) {
        handleSelectDestination(matchingDestinations[selectedIndex]);
      } else if (searchInput.trim()) {
        handleAskWeatherGPTDirect(searchInput.trim());
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < matchingDestinations.length) {
      handleSelectDestination(matchingDestinations[selectedIndex]);
    } else if (searchInput.trim()) {
      handleAskWeatherGPTDirect(searchInput.trim());
    }
  };

  const handleLocationSearch = async (q: string) => {
    setLocationQuery(q);
    if (q.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    // Instant local multilingual resolution for English, Hindi, and Marathi
    const localMatches = searchMultilingualLocations(q, language);
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
    }

    if (q.trim().length < 2) return;

    setSearching(true);
    try {
      const geocodeQuery = getEnglishQueryForGeocoding(q);
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(geocodeQuery)}`);
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
        const merged = [...localMatches];
        for (const item of data.results) {
          if (!seen.has(item.name.toLowerCase())) {
            seen.add(item.name.toLowerCase());
            merged.push(item);
          }
        }
        setSearchResults(merged);
      }
    } catch (e) {
      console.error(e);
      if (localMatches.length > 0) {
        setSearchResults(localMatches);
      }
    } finally {
      setSearching(false);
    }
  };

  const selectNewLocation = (loc: GeoLocation) => {
    onLocationChange(loc);
    setShowLocationPicker(false);
    setLocationQuery('');
    setSearchResults([]);
  };

  const popularCities = POPULAR_LOCATIONS;

  return (
    <header className="h-16 bg-white/90 dark:bg-[#070b19]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-indigo-500/15 px-3 sm:px-6 md:px-8 flex items-center justify-between z-30 sticky top-0 transition-colors duration-200">
      {/* Mobile Menu Hamburger (Visible on < md) */}
      {onOpenMobileNav && (
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 -ml-1 mr-1 sm:mr-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Global Smart Navigation Search / Ask WeatherGPT Bar */}
      <div className="flex-1 max-w-xl relative min-w-0 mr-1.5 sm:mr-4" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 sm:left-4 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-indigo-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => {
                if (searchInput.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search city, village, district... (e.g. Delhi, Mumbai, Pune)"
              className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] focus:bg-white dark:bg-[#0e1834]/80 dark:hover:bg-[#13234d] dark:focus:bg-[#101e42] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 pl-9 sm:pl-11 pr-9 sm:pr-14 py-2 sm:py-2.5 rounded-full border border-slate-200/90 dark:border-indigo-500/25 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm truncate placeholder:truncate"
            />
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="absolute right-1 sm:right-1.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
              title="Search or Ask WeatherGPT"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 -rotate-12 translate-x-[-1px] translate-y-[-0.5px]" />
            </button>
          </div>
        </form>

        {/* Live Search Autocomplete Suggestions Dropdown */}
        {showSuggestions && searchInput.trim().length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-[calc(100vw-3.25rem)] max-w-xl md:w-full md:left-0 md:right-0 bg-white dark:bg-[#0e1834] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-indigo-500/25 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] md:max-h-[460px] flex flex-col backdrop-blur-xl">
            <div className="overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              {/* Destination Suggestions */}
              {matchingDestinations.length > 0 ? (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {matchingDestinations.some(d => d.category === 'sector')
                      ? t.topNav.resultsGroupSectors
                      : t.topNav.resultsGroupNav}
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingDestinations.map((dest, idx) => {
                      const Icon = dest.icon;
                      const isHighlighted = selectedIndex === idx;
                      const title = dest.titles[language] || dest.titles.en;
                      const subtitle = dest.subtitles[language] || dest.subtitles.en;
                      const isSector = dest.category === 'sector';

                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => handleSelectDestination(dest)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-between transition-colors group ${
                            isHighlighted
                              ? 'bg-blue-50 dark:bg-indigo-600/30 border border-blue-200/80 dark:border-indigo-500/40 text-blue-900 dark:text-white'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isHighlighted
                                  ? 'bg-[#1d68f5] dark:bg-indigo-600 text-white shadow-sm'
                                  : isSector
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-blue-50 dark:bg-indigo-950/50 text-blue-600 dark:text-indigo-400'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1 pr-1.5 sm:pr-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                                <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 break-words">{title}</span>
                                <span
                                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                                    isSector
                                      ? 'bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-blue-100/70 dark:bg-indigo-900/40 text-blue-700 dark:text-indigo-300'
                                  }`}
                                >
                                  {isSector ? 'Sector' : 'Navigation'}
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight mt-0.5">{subtitle}</p>
                            </div>
                          </div>
                          <ArrowRight
                            className={`h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-transform flex-shrink-0 ml-1 sm:ml-2 ${
                              isHighlighted ? 'translate-x-0.5 text-blue-600 dark:text-indigo-400' : ''
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {t.topNav.noResults}
                </div>
              )}

              {/* Direct WeatherGPT Chat Action at bottom */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAskWeatherGPTDirect(searchInput.trim())}
                  onMouseEnter={() => setSelectedIndex(matchingDestinations.length)}
                  className={`w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-between transition-colors group ${
                    selectedIndex === matchingDestinations.length
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-500/40 text-indigo-950 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 pr-1.5 sm:pr-2">
                      <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                        {t.topNav.quickAskPrefix} &quot;{searchInput}&quot;
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {t.topNav.pressEnterToAsk}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 sm:px-2 py-1 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <span>↵ Enter</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Country/Location Badge, Theme Toggle, Notification Bell, User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3 relative flex-shrink-0">
        {/* Country & Location Badge Pill matching reference screenshot */}
        <div className="static sm:relative" ref={locationPickerRef}>
          <button
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            title={`${currentLocation.name}${currentLocation.subdistrict ? ', ' + currentLocation.subdistrict : ''}${currentLocation.district ? ', ' + currentLocation.district : ''}${currentLocation.admin1 ? ', ' + currentLocation.admin1 : ''}${currentLocation.country ? ', ' + currentLocation.country : ''}`}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/80 dark:bg-[#0e1834] dark:hover:bg-[#15244e] border border-slate-200/90 dark:border-indigo-500/25 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            <span className="text-sm">🇮🇳</span>
            <span className="max-w-[70px] sm:max-w-[120px] md:max-w-[160px] truncate">
              {currentLocation.name || 'India'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 flex-shrink-0" />
          </button>

          {/* Location Dropdown Modal */}
          {showLocationPicker && (
            <div className="absolute right-3 sm:right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-80 rounded-2xl bg-white dark:bg-[#0e1834] p-3 shadow-2xl border border-slate-200 dark:border-indigo-500/25 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{t.topNav.selectLocation}</span>
                <span className="text-[10px] text-slate-400">Open-Meteo Geocoding</span>
              </div>

              {/* Use My Current Location Trigger */}
              {onUseCurrentLocation && (
                <button
                  type="button"
                  onClick={async () => {
                    await onUseCurrentLocation();
                  }}
                  disabled={isLocatingCurrent}
                  className="w-full mb-2.5 px-3 py-2 rounded-xl bg-blue-50/80 dark:bg-indigo-950/60 hover:bg-blue-100/80 dark:hover:bg-indigo-900/60 border border-blue-200/80 dark:border-indigo-500/30 text-blue-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-between transition-colors group shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <LocateFixed className={`h-3.5 w-3.5 text-blue-600 dark:text-indigo-400 ${isLocatingCurrent ? 'animate-spin' : ''}`} />
                    <span>{isLocatingCurrent ? 'Detecting Location...' : 'Use My Current Location'}</span>
                  </div>
                  <span className="text-[10px] text-blue-500 dark:text-indigo-400 font-medium group-hover:underline">GPS</span>
                </button>
              )}

              {locationError && (
                <div className="mb-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 leading-tight">
                  {locationError}
                </div>
              )}

              <input
                type="text"
                value={locationQuery}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search city, town, taluka or village..."
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                autoFocus
              />

              {searching && (
                <div className="text-center py-3 text-xs text-slate-400">{t.topNav.searching}</div>
              )}

              {searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((loc, i) => (
                    <button
                      key={i}
                      onClick={() => selectNewLocation(loc)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-indigo-950/50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-indigo-400 truncate">
                          {getLocalizedLocationName(loc, language)}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {loc.admin2 ? `${loc.admin2}, ` : ''}
                          {loc.admin1 ? `${getLocalizedAdmin1(loc.admin1, language)}, ` : ''}
                          {getLocalizedCountry(loc.country, language)}
                        </div>
                      </div>
                      {currentLocation.name === loc.name && (
                        <Check className="h-3 w-3 text-blue-600 dark:text-indigo-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {t.topNav.popularCities}
                  </span>
                  <div className="space-y-1">
                    {popularCities.map((city, i) => (
                      <button
                        key={i}
                        onClick={() => selectNewLocation(city)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-200"
                      >
                        <span>
                          {getLocalizedLocationName(city, language)}, {getLocalizedCountry(city.country, language)}
                        </span>
                        {currentLocation.name === city.name && (
                          <Check className="h-3 w-3 text-blue-600 dark:text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark/Light Mode Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#0e1834] dark:hover:bg-[#162550] border border-slate-200/90 dark:border-indigo-500/20 flex items-center justify-center text-slate-600 dark:text-amber-300 transition-colors shadow-xs"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 animate-pulse-subtle" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </button>

        {/* Notification Center */}
        {alerts && (
          <AlertNotificationCenter
            alerts={alerts}
            onSelectAlert={onSelectAlert || (() => {})}
            onNavigateToAlerts={onNavigateToAlerts}
          />
        )}

        {/* Profile Button & Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#0e1834] dark:hover:bg-[#162550] border border-slate-200/90 dark:border-indigo-500/20 flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-xs transition-colors relative cursor-pointer"
            aria-label="User Account"
          >
            <User className="h-4 w-4" />
            {userRole === 'admin' && (
              <span
                className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-purple-500 ring-2 ring-white dark:ring-[#070b19]"
                title="Admin Account"
              />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-[#0e1834] border border-slate-200 dark:border-indigo-500/25 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
              <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate" title={currentUser?.email || ''}>
                    {currentUser?.email || 'WeatherGPT User'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                      userRole === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {userRole === 'admin' ? 'ADMIN' : 'USER'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {userRole === 'admin' ? 'Administrator Account' : 'Standard User Account'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>{t.auth?.logout || 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
