'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { DashboardView } from '@/components/DashboardView';
import { AskWeatherGPTView } from '@/components/AskWeatherGPTView';
import { OtherView } from '@/components/OtherViews';
import { GeoLocation, WeatherData } from '@/lib/types';
import { WeatherAlert, AlertSummaryCounts } from '@/lib/alertTypes';
import { isAlertDismissed, generateAlertKey, sortAlertsBySeverity } from '@/lib/alertEngine';
import { AlertPopup } from '@/components/AlertPopup';
import { FloatingRobotAssistant } from '@/components/FloatingRobotAssistant';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { SectorId } from '@/lib/sectoral/types';

const WEATHERGPT_LOCATION_STORAGE_KEY = 'weathergpt_selected_location_v2';

function WeatherGPTApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetSector, setTargetSector] = useState<SectorId | undefined>(undefined);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation>({
    name: 'New Delhi',
    country: 'India',
    country_code: 'IN',
    admin1: 'Delhi',
    admin2: 'New Delhi',
    state: 'Delhi',
    district: 'New Delhi',
    latitude: 28.6214,
    longitude: 77.2148,
    timezone: 'Asia/Kolkata',
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  const [isLocatingCurrent, setIsLocatingCurrent] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Alerts State
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<AlertSummaryCounts>({
    redCount: 0,
    orangeCount: 0,
    yellowCount: 0,
    greenCount: 1,
    totalActive: 0,
  });
  const [activePopupAlert, setActivePopupAlert] = useState<WeatherAlert | null>(null);

  // Browser Geolocation Detection with Reverse Geocoding
  const detectCurrentLocation = useCallback(async (isUserInitiated: boolean = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (isUserInitiated) {
        setLocationError('Geolocation is not supported by your browser.');
      }
      return;
    }

    if (isUserInitiated) {
      setIsLocatingCurrent(true);
      setLocationError(null);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.location) {
              const exactLocation: GeoLocation = {
                ...data.location,
                latitude,
                longitude,
              };
              setCurrentLocation(exactLocation);
              try {
                localStorage.setItem(
                  WEATHERGPT_LOCATION_STORAGE_KEY,
                  JSON.stringify(exactLocation)
                );
              } catch {}
            }
          }
        } catch (e) {
          console.error('Error reverse geocoding current location:', e);
          if (isUserInitiated) {
            setLocationError('Failed to resolve locality for current coordinates.');
          }
        } finally {
          setIsLocatingCurrent(false);
        }
      },
      (error) => {
        console.warn('Geolocation access declined or unavailable:', error.message);
        if (isUserInitiated) {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Location access was not granted. Search for a location below.');
          } else {
            setLocationError('Unable to retrieve current location.');
          }
        }
        setIsLocatingCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Restore stored location on mount or gentle first-time detection
  useEffect(() => {
    let saved: GeoLocation | null = null;
    try {
      const raw = localStorage.getItem(WEATHERGPT_LOCATION_STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw);
      }
    } catch {}

    if (saved && typeof saved.latitude === 'number' && typeof saved.longitude === 'number') {
      setCurrentLocation(saved);
    } else {
      // First visit: attempt gentle browser geolocation detection
      detectCurrentLocation(false);
    }
  }, [detectCurrentLocation]);

  const loadWeather = useCallback(async (loc: GeoLocation) => {
    setLoadingWeather(true);
    try {
      const res = await fetch(
        `/api/weather?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(
          loc.name
        )}&country=${encodeURIComponent(loc.country || '')}&timezone=${encodeURIComponent(
          loc.timezone || 'Asia/Kolkata'
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  const loadAlerts = useCallback(async (loc: GeoLocation) => {
    try {
      const res = await fetch(
        `/api/alerts?lat=${loc.latitude}&lon=${loc.longitude}&location=${encodeURIComponent(
          loc.name
        )}&district=${encodeURIComponent(loc.district || loc.admin2 || '')}&state=${encodeURIComponent(
          loc.state || loc.admin1 || ''
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        const locAlerts: WeatherAlert[] = data.locationAlerts || [];
        setAlerts(locAlerts);
        if (data.summaryCounts) {
          setSummaryCounts(data.summaryCounts);
        }

        // Check for new undismissed high-severity (RED or ORANGE) alerts affecting location
        const criticalAlerts = sortAlertsBySeverity(
          locAlerts.filter((a) => a.severity === 'RED' || a.severity === 'ORANGE')
        );

        const undismissed = criticalAlerts.find((a) => !isAlertDismissed(generateAlertKey(a)));
        if (undismissed) {
          setActivePopupAlert(undismissed);
        }
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }, []);

  useEffect(() => {
    loadWeather(currentLocation);
    loadAlerts(currentLocation);

    // Poll alerts every 5 minutes
    const interval = setInterval(() => {
      loadAlerts(currentLocation);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentLocation, loadWeather, loadAlerts]);

  const handleLocationChange = (newLoc: GeoLocation) => {
    setCurrentLocation(newLoc);
    setLocationError(null);
    try {
      localStorage.setItem(WEATHERGPT_LOCATION_STORAGE_KEY, JSON.stringify(newLoc));
    } catch {}
  };

  const handleQuickAsk = (question?: string) => {
    if (question) {
      setPendingQuestion(question);
    }
    setActiveTab('ask-weathergpt');
  };

  const handleNavigate = (tab: string, sector?: SectorId) => {
    setActiveTab(tab);
    if (sector) {
      setTargetSector(sector);
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7fb] dark:bg-[#070b19] overflow-hidden transition-colors duration-200">
      {/* Left Sidebar (Desktop + Mobile Slide-over Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f4f7fb] dark:bg-[#070b19] text-slate-800 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        {/* Top Navigation */}
        <TopNav
          currentLocation={currentLocation}
          onLocationChange={handleLocationChange}
          onQuickAsk={handleQuickAsk}
          onNavigate={handleNavigate}
          onUseCurrentLocation={() => detectCurrentLocation(true)}
          isLocatingCurrent={isLocatingCurrent}
          locationError={locationError}
          alerts={alerts}
          onSelectAlert={(a) => {
            setActiveTab('alerts');
          }}
          onNavigateToAlerts={() => setActiveTab('alerts')}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Tab View Routing */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              weather={weather}
              loading={loadingWeather}
              onOpenChat={handleQuickAsk}
              onLocationChange={handleLocationChange}
              onRefresh={() => loadWeather(currentLocation)}
              onNavigateToAlerts={() => setActiveTab('alerts')}
              onNavigateToForecast={() => setActiveTab('forecast')}
              onNavigateToMaps={() => setActiveTab('maps')}
              alerts={alerts}
              summaryCounts={summaryCounts}
            />
          )}

          {activeTab === 'ask-weathergpt' && (
            <AskWeatherGPTView
              currentLocation={currentLocation}
              pendingInitialQuestion={pendingQuestion}
              onClearInitialQuestion={() => setPendingQuestion('')}
              onLocationChange={handleLocationChange}
            />
          )}

          {activeTab !== 'dashboard' && activeTab !== 'ask-weathergpt' && (
            <OtherView
              viewId={activeTab}
              weather={weather}
              loading={loadingWeather}
              onRefresh={() => loadWeather(currentLocation)}
              onOpenChat={handleQuickAsk}
              currentLocation={currentLocation}
              onLocationChange={handleLocationChange}
              alerts={alerts}
              targetSector={targetSector}
            />
          )}
        </main>
      </div>

      {/* Global Emergency Alert Popup for High-Severity Warnings */}
      <AlertPopup
        alert={activePopupAlert}
        onDismiss={() => setActivePopupAlert(null)}
        onViewAlert={(a) => {
          setActivePopupAlert(null);
          setActiveTab('alerts');
        }}
        onOpenChat={handleQuickAsk}
      />

      {/* Interactive Global AI Weather Assistant Floating Robot */}
      <FloatingRobotAssistant
        activeTab={activeTab}
        weather={weather}
        onOpenChat={handleQuickAsk}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <WeatherGPTApp />
    </LanguageProvider>
  );
}
