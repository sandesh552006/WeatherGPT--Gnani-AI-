'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RotateCcw, LocateFixed, Sparkles, MapPin } from 'lucide-react';
import { WeatherAlert, IMD_SEVERITY_CONFIG } from '@/lib/alertTypes';
import { GeoLocation } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName, getLocalizedCountry } from '@/lib/i18n/locations';

interface AlertMapInnerProps {
  alerts: WeatherAlert[];
  currentLocation: GeoLocation;
  onSelectAlert: (alert: WeatherAlert) => void;
  onOpenChat: (q?: string) => void;
  heightClass?: string;
}

const INDIA_CENTER: [number, number] = [22.5, 79.5];

export default function AlertMapInner({
  alerts,
  currentLocation,
  onSelectAlert,
  onOpenChat,
  heightClass = 'h-[420px]',
}: AlertMapInnerProps) {
  const { language } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: 4.6,
      minZoom: 4,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    ).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when alerts or location change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Current Location Marker
    if (currentLocation) {
      const pinIcon = L.divIcon({
        className: 'current-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute h-8 w-8 rounded-full bg-blue-500/30 animate-ping"></span>
            <div class="relative h-6 w-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black">
              📍
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const currentMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: pinIcon,
        zIndexOffset: 500,
      });
      currentMarker.bindPopup(`
        <div class="p-2.5 text-slate-800 font-sans text-xs">
          <div class="font-extrabold text-slate-900 flex items-center gap-1">
            <span class="text-blue-600">📍</span> Selected Location
          </div>
          <div class="font-bold text-slate-700 mt-0.5">${getLocalizedLocationName(currentLocation, language)}</div>
        </div>
      `);
      group.addLayer(currentMarker);
    }

    // 2. Alert Markers
    alerts.forEach((alert) => {
      if (!alert.coordinates) return;

      const { latitude, longitude } = alert.coordinates;
      const config = IMD_SEVERITY_CONFIG[alert.severity];
      const isRed = alert.severity === 'RED';

      // Circle coverage zone
      const circle = L.circle([latitude, longitude], {
        radius: isRed ? 75000 : 55000,
        color: config.hex,
        fillColor: config.hex,
        fillOpacity: isRed ? 0.45 : 0.3,
        weight: isRed ? 2.5 : 1.5,
      });

      // Marker Icon
      const alertIcon = L.divIcon({
        className: 'alert-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            ${isRed ? '<span class="absolute h-8 w-8 rounded-full bg-rose-500/40 animate-ping"></span>' : ''}
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-black shadow-lg border border-white whitespace-nowrap" style="background-color: ${config.hex};">
              <span>${config.icon}</span>
              <span>${alert.severity}</span>
            </div>
          </div>
        `,
        iconSize: [60, 22],
        iconAnchor: [30, 11],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([latitude, longitude], { icon: alertIcon, zIndexOffset: isRed ? 1000 : 100 });

      const popupContent = `
        <div class="p-3 text-slate-800 font-sans min-w-[220px]">
          <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <div class="flex items-center gap-1.5">
              <span class="text-xs">${config.icon}</span>
              <span class="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${config.badgeBg} ${config.badgeText}">
                ${alert.severity}
              </span>
            </div>
            <span class="text-[9px] font-mono text-slate-400">IMD Alert</span>
          </div>

          <div class="font-extrabold text-slate-900 text-sm mb-0.5">${alert.event}</div>
          <div class="text-[11px] text-slate-500 font-medium mb-2">${alert.location}</div>

          <div class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-600 space-y-1 mb-2.5">
            <div>Valid: <strong class="text-slate-800">Until ${new Date(alert.validUntil).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong></div>
            <div>Authority: <strong class="text-slate-800">${alert.source.split('/')[0]?.trim()}</strong></div>
          </div>

          <button
            id="map-ask-btn-${alert.id}"
            class="w-full py-1.5 rounded-lg bg-[#1d68f5] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <span>Ask WeatherGPT</span>
          </button>
        </div>
      `;

      circle.bindPopup(popupContent);
      marker.bindPopup(popupContent);

      const bindPopupHandler = (target: L.Layer) => {
        target.on('popupopen', () => {
          const btn = document.getElementById(`map-ask-btn-${alert.id}`);
          if (btn) {
            btn.onclick = () => {
              onOpenChat(
                `What does this ${alert.severity} ${alert.event} warning for ${alert.location} mean and what precautions should be taken?`
              );
            };
          }
        });
      };

      bindPopupHandler(circle);
      bindPopupHandler(marker);

      group.addLayer(circle);
      group.addLayer(marker);
    });
  }, [alerts, currentLocation, onOpenChat, language]);

  const handleReset = () => {
    mapInstanceRef.current?.flyTo(INDIA_CENTER, 4.6, { duration: 1.2 });
  };

  const handleLocate = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 7, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-slate-200/90">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-bold text-xs"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-bold text-xs"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          title="Reset India View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleLocate}
          className="p-2 rounded-lg hover:bg-slate-100 text-blue-600"
          title="Center on Selected Location"
        >
          <LocateFixed className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dynamic IMD Color Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-200/90 text-xs flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IMD Warning Level:</span>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Red (Warning)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Orange (Alert)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Yellow (Watch)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Green (Normal)
          </span>
        </div>
      </div>
    </div>
  );
}
