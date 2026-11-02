'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  RefreshCw,
  LocateFixed,
  RotateCcw,
  Sparkles,
  CloudRain,
  Thermometer,
  Wind,
  Layers,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { GeoLocation, MapGridPoint, MapRiskSummary, WeatherMapLayer } from '@/lib/types';
import { getWeatherCondition } from '@/lib/wmo';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName, getLocalizedCountry, getLocalizedAdmin1 } from '@/lib/i18n/locations';

export interface WeatherMapProps {
  mode?: 'compact' | 'full';
  currentLocation: GeoLocation;
  activeLayer?: WeatherMapLayer;
  onLayerChange?: (layer: WeatherMapLayer) => void;
  onOpenChat?: (question?: string) => void;
  onLocationChange?: (loc: GeoLocation) => void;
  heightClass?: string;
  className?: string;
  selectedHourOffset?: number; // 0 = now, 3 = +3h, etc.
  onHourOffsetChange?: (offset: number) => void;
}

// India center coordinates & bounds
const INDIA_CENTER: [number, number] = [22.5, 79.5];
const INDIA_DEFAULT_ZOOM = 4.7;

// Rain intensity color mapping
function getRainColor(precip: number, prob: number): { fill: string; stroke: string; label: string; isHeavy: boolean } {
  if (precip >= 15 || prob >= 90) {
    return { fill: '#7e22ce', stroke: '#581c87', label: 'Extreme Rain', isHeavy: true };
  }
  if (precip >= 8 || prob >= 80) {
    return { fill: '#ef4444', stroke: '#b91c1c', label: 'Very Heavy Rain', isHeavy: true };
  }
  if (precip >= 3 || prob >= 65) {
    return { fill: '#f97316', stroke: '#c2410c', label: 'Heavy Rain', isHeavy: true };
  }
  if (precip >= 1 || prob >= 40) {
    return { fill: '#eab308', stroke: '#a16207', label: 'Moderate Rain', isHeavy: false };
  }
  if (precip > 0 || prob >= 20) {
    return { fill: '#22c55e', stroke: '#15803d', label: 'Light Rain', isHeavy: false };
  }
  return { fill: '#94a3b8', stroke: '#64748b', label: 'No Rain', isHeavy: false };
}

// Temperature color mapping
function getTempColor(temp: number): { fill: string; stroke: string; label: string } {
  if (temp >= 40) return { fill: '#b91c1c', stroke: '#7f1d1d', label: 'Extreme Heat (40°C+)' };
  if (temp >= 35) return { fill: '#ea580c', stroke: '#9a3412', label: 'Hot (35–40°C)' };
  if (temp >= 30) return { fill: '#f59e0b', stroke: '#b45309', label: 'Warm (30–35°C)' };
  if (temp >= 24) return { fill: '#10b981', stroke: '#047857', label: 'Normal (24–30°C)' };
  if (temp >= 18) return { fill: '#06b6d4', stroke: '#0e7490', label: 'Cool (18–24°C)' };
  return { fill: '#3b82f6', stroke: '#1d4ed8', label: 'Cold (<18°C)' };
}

export default function WeatherMapInner({
  mode = 'compact',
  currentLocation,
  activeLayer = 'rainfall',
  onLayerChange,
  onOpenChat,
  onLocationChange,
  heightClass,
  className = '',
  selectedHourOffset = 0,
  onHourOffsetChange,
}: WeatherMapProps) {
  const { language, t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const weatherLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const clickedMarkerRef = useRef<L.Marker | null>(null);

  const [internalLayer, setInternalLayer] = useState<WeatherMapLayer>(activeLayer);
  const [internalHourOffset, setInternalHourOffset] = useState<number>(selectedHourOffset);
  const [gridData, setGridData] = useState<{ points: MapGridPoint[]; riskSummary: MapRiskSummary; updatedAt: string } | null>(null);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(true);
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lon: number;
    name?: string;
    weather?: any;
    loading?: boolean;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Synchronize internal layer with props
  useEffect(() => {
    if (activeLayer) setInternalLayer(activeLayer);
  }, [activeLayer]);

  useEffect(() => {
    if (selectedHourOffset !== undefined) setInternalHourOffset(selectedHourOffset);
  }, [selectedHourOffset]);

  const currentLayer = activeLayer || internalLayer;
  const currentHour = selectedHourOffset !== undefined ? selectedHourOffset : internalHourOffset;

  const handleSelectLayer = (layer: WeatherMapLayer) => {
    setInternalLayer(layer);
    onLayerChange?.(layer);
  };

  const handleSelectHour = (offset: number) => {
    setInternalHourOffset(offset);
    onHourOffsetChange?.(offset);
  };

  // 1. Fetch Open-Meteo India Grid Data (Cached via /api/weather/grid)
  const loadGridData = useCallback(async (refresh = false) => {
    setLoadingGrid(true);
    try {
      const res = await fetch(`/api/weather/grid${refresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setGridData(data);
      }
    } catch (e) {
      console.error('Failed to load India weather grid:', e);
    } finally {
      setLoadingGrid(false);
    }
  }, []);

  useEffect(() => {
    loadGridData();
  }, [loadGridData]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: mode === 'compact' ? 4.2 : INDIA_DEFAULT_ZOOM,
      minZoom: 3.5,
      maxZoom: 14,
      zoomControl: false, // We render clean custom zoom controls
      attributionControl: true,
    });

    // Initial base tile layer: OpenStreetMap
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    tileLayerRef.current = osmLayer;

    // Layer group for weather overlays
    const weatherGroup = L.layerGroup().addTo(map);
    weatherLayersGroupRef.current = weatherGroup;

    mapInstanceRef.current = map;

    // Handle map click anywhere to inspect coordinates
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const roundedLat = Math.round(lat * 100) / 100;
      const roundedLng = Math.round(lng * 100) / 100;

      setClickedLocation({
        lat: roundedLat,
        lon: roundedLng,
        loading: true,
      });

      // Place / move temporary clicked marker
      if (clickedMarkerRef.current) {
        clickedMarkerRef.current.remove();
      }

      const clickIcon = L.divIcon({
        className: 'clicked-pin',
        html: `
          <div class="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 border-2 border-white shadow-lg text-white text-xs">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const newMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
      clickedMarkerRef.current = newMarker;

      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia/Kolkata`
        );
        if (res.ok) {
          const raw = await res.json();
          const cur = raw.current || {};
          const cond = getWeatherCondition(cur.weather_code ?? 0);
          const weatherInfo = {
            temperature: Math.round(cur.temperature_2m ?? 0),
            feelsLike: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
            humidity: Math.round(cur.relative_humidity_2m ?? 0),
            precipitation: cur.precipitation ?? 0,
            windSpeed: Math.round(cur.wind_speed_10m ?? 0),
            conditionText: cond.description,
            conditionIcon: cond.icon,
          };

          setClickedLocation({
            lat: roundedLat,
            lon: roundedLng,
            name: `Location (${roundedLat}°, ${roundedLng}°)`,
            weather: weatherInfo,
            loading: false,
          });

          // Bind rich popup with Ask WeatherGPT button
          const popupContent = `
            <div class="p-3 text-slate-800 font-sans min-w-[210px]">
              <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                <span class="text-xs font-bold text-slate-900">Custom Point</span>
                <span class="text-[10px] text-slate-400 font-mono">${roundedLat}, ${roundedLng}</span>
              </div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">${weatherInfo.conditionIcon}</span>
                <div>
                  <div class="text-lg font-black text-slate-900">${weatherInfo.temperature}°C</div>
                  <div class="text-[11px] text-slate-500 font-medium">${weatherInfo.conditionText}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2.5">
                <div>💧 Humidity: <strong class="text-slate-800">${weatherInfo.humidity}%</strong></div>
                <div>💨 Wind: <strong class="text-slate-800">${weatherInfo.windSpeed} km/h</strong></div>
                <div>🌧 Precip: <strong class="text-slate-800">${weatherInfo.precipitation} mm</strong></div>
                <div>🌡 Feels: <strong class="text-slate-800">${weatherInfo.feelsLike}°C</strong></div>
              </div>
              <button
                id="popup-ask-btn"
                class="w-full py-1.5 rounded-lg bg-[#1d68f5] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
              >
                <span>Ask WeatherGPT</span>
              </button>
            </div>
          `;

          newMarker.bindPopup(popupContent).openPopup();

          setTimeout(() => {
            const btn = document.getElementById('popup-ask-btn');
            if (btn) {
              btn.onclick = () => {
                onOpenChat?.(`What is the current weather and forecast for coordinates ${roundedLat}, ${roundedLng}?`);
              };
            }
          }, 100);
        }
      } catch (err) {
        console.error('Failed to fetch clicked point weather:', err);
      }
    });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mode, onOpenChat]);

  // 3. Switch Base Tile Layer (Satellite vs OpenStreetMap)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (currentLayer === 'satellite') {
      // Legitimate ESRI World Imagery satellite tiles with proper attribution
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }
      ).addTo(map);
      tileLayerRef.current = satLayer;
    } else {
      // Standard OpenStreetMap tiles
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      tileLayerRef.current = osmLayer;
    }
  }, [currentLayer]);

  // 4. Update Weather Overlays when Layer, Hour, or GridData changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = weatherLayersGroupRef.current;
    if (!map || !group || !gridData?.points) return;

    // Clear previous weather markers and circles
    group.clearLayers();

    const hourIdx = Math.min(Math.max(currentHour, 0), 23);

    gridData.points.forEach((pt) => {
      // Selected hour forecast data for this point
      const hourItem = pt.hourly[hourIdx] || pt.hourly[0];
      const temp = hourItem ? hourItem.temperature : pt.current.temperature;
      const precip = hourItem ? hourItem.precipitation : pt.current.precipitation;
      const prob = hourItem ? hourItem.rainProbability : pt.current.rainProbability;
      const windSpeed = hourItem ? hourItem.windSpeed : pt.current.windSpeed;
      const windDir = hourItem ? hourItem.windDirection : pt.current.windDirection;
      const condIcon = hourItem ? hourItem.conditionIcon : pt.current.conditionIcon;
      const condText = pt.current.conditionText;

      // Popup Content template
      const popupHtml = `
        <div class="p-3 text-slate-800 font-sans min-w-[220px]">
          <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <div>
              <span class="text-xs font-bold text-slate-900">${getLocalizedLocationName(pt.name, language)}</span>
              <span class="text-[10px] text-slate-400 block">${getLocalizedAdmin1(pt.state, language)}</span>
            </div>
            <span class="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded">
              ${hourIdx === 0 ? 'NOW' : hourItem?.hourLabel || 'Forecast'}
            </span>
          </div>

          <div class="flex items-center gap-2.5 mb-2">
            <span class="text-2xl">${condIcon}</span>
            <div>
              <div class="text-xl font-extrabold text-slate-900">${temp}°C</div>
              <div class="text-[11px] text-slate-500 font-medium">${condText}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2.5">
            <div>🌧 Rain: <strong class="text-slate-800">${prob}%</strong></div>
            <div>💧 Precip: <strong class="text-slate-800">${precip} mm</strong></div>
            <div>💨 Wind: <strong class="text-slate-800">${windSpeed} km/h</strong></div>
            <div>🧭 Dir: <strong class="text-slate-800">${windDir}°</strong></div>
          </div>

          ${
            precip >= 3 || prob >= 70
              ? `<div class="mb-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium">
                  ⚠️ Potential Heavy Rain Area (${precip}mm, ${prob}%)
                </div>`
              : ''
          }

          <button
            id="ask-btn-${pt.id}"
            class="w-full py-1.5 rounded-lg bg-[#1d68f5] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <span>Ask WeatherGPT</span>
          </button>
        </div>
      `;

      // ----------------------------------------------------------------------
      // LAYER 1: RAINFALL
      // ----------------------------------------------------------------------
      if (currentLayer === 'rainfall') {
        const rainInfo = getRainColor(precip, prob);

        // Circular heat zone
        const circle = L.circle([pt.latitude, pt.longitude], {
          radius: mode === 'compact' ? 55000 : 70000,
          color: rainInfo.stroke,
          fillColor: rainInfo.fill,
          fillOpacity: precip > 0 || prob >= 30 ? 0.6 : 0.25,
          weight: rainInfo.isHeavy ? 2.5 : 1.5,
        });

        circle.bindPopup(popupHtml);
        circle.on('popupopen', () => {
          const btn = document.getElementById(`ask-btn-${pt.id}`);
          if (btn) {
            btn.onclick = () => {
              onLocationChange?.({
                name: pt.name,
                country: 'India',
                latitude: pt.latitude,
                longitude: pt.longitude,
              });
              onOpenChat?.(`What is the rainfall forecast for ${pt.name}, ${pt.state}?`);
            };
          }
        });
        group.addLayer(circle);

        // Marker badge icon
        const rainIcon = L.divIcon({
          className: 'weather-pin',
          html: `
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-black shadow-md border border-white/80 whitespace-nowrap ${
              rainInfo.isHeavy ? 'animate-bounce' : ''
            }" style="background-color: ${rainInfo.fill};">
              <span>${precip > 0 ? `${precip}mm` : `${prob}%`}</span>
            </div>
          `,
          iconSize: [46, 20],
          iconAnchor: [23, 10],
          popupAnchor: [0, -12],
        });

        const marker = L.marker([pt.latitude, pt.longitude], { icon: rainIcon });
        marker.bindPopup(popupHtml);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`ask-btn-${pt.id}`);
          if (btn) {
            btn.onclick = () => {
              onLocationChange?.({
                name: pt.name,
                country: 'India',
                latitude: pt.latitude,
                longitude: pt.longitude,
              });
              onOpenChat?.(`What is the rainfall forecast for ${pt.name}, ${pt.state}?`);
            };
          }
        });
        group.addLayer(marker);
      }

      // ----------------------------------------------------------------------
      // LAYER 2: TEMPERATURE
      // ----------------------------------------------------------------------
      else if (currentLayer === 'temp') {
        const tempInfo = getTempColor(temp);

        // Thermal circle zone
        const circle = L.circle([pt.latitude, pt.longitude], {
          radius: mode === 'compact' ? 55000 : 70000,
          color: tempInfo.stroke,
          fillColor: tempInfo.fill,
          fillOpacity: 0.45,
          weight: 1.5,
        });

        circle.bindPopup(popupHtml);
        circle.on('popupopen', () => {
          const btn = document.getElementById(`ask-btn-${pt.id}`);
          if (btn) {
            btn.onclick = () => {
              onLocationChange?.({
                name: pt.name,
                country: 'India',
                latitude: pt.latitude,
                longitude: pt.longitude,
              });
              onOpenChat?.(`What is the temperature trend for ${pt.name}, ${pt.state}?`);
            };
          }
        });
        group.addLayer(circle);

        // Marker badge icon
        const tempIcon = L.divIcon({
          className: 'weather-pin',
          html: `
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[11px] font-black shadow-md border border-white/80 whitespace-nowrap" style="background-color: ${tempInfo.fill};">
              <span>${temp}°C</span>
            </div>
          `,
          iconSize: [42, 20],
          iconAnchor: [21, 10],
          popupAnchor: [0, -12],
        });

        const marker = L.marker([pt.latitude, pt.longitude], { icon: tempIcon });
        marker.bindPopup(popupHtml);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`ask-btn-${pt.id}`);
          if (btn) {
            btn.onclick = () => {
              onLocationChange?.({
                name: pt.name,
                country: 'India',
                latitude: pt.latitude,
                longitude: pt.longitude,
              });
              onOpenChat?.(`What is the temperature trend for ${pt.name}, ${pt.state}?`);
            };
          }
        });
        group.addLayer(marker);
      }

      // ----------------------------------------------------------------------
      // LAYER 3: WIND
      // ----------------------------------------------------------------------
      else if (currentLayer === 'wind') {
        const windIcon = L.divIcon({
          className: 'wind-pin',
          html: `
            <div class="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/90 text-white text-[10px] font-bold shadow-lg border border-cyan-400/50 whitespace-nowrap">
              <div style="transform: rotate(${windDir}deg);" class="text-cyan-300 inline-block font-black text-xs">
                ↑
              </div>
              <span class="text-cyan-200">${windSpeed} km/h</span>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [30, 12],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([pt.latitude, pt.longitude], { icon: windIcon });
        marker.bindPopup(popupHtml);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`ask-btn-${pt.id}`);
          if (btn) {
            btn.onclick = () => {
              onLocationChange?.({
                name: pt.name,
                country: 'India',
                latitude: pt.latitude,
                longitude: pt.longitude,
              });
              onOpenChat?.(`What are the wind conditions in ${pt.name}?`);
            };
          }
        });
        group.addLayer(marker);
      }

      // ----------------------------------------------------------------------
      // LAYER 4: SATELLITE
      // ----------------------------------------------------------------------
      else if (currentLayer === 'satellite') {
        const satIcon = L.divIcon({
          className: 'satellite-pin',
          html: `
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/80 backdrop-blur-md text-white text-[10px] font-bold shadow-xl border border-white/30 whitespace-nowrap">
              <span>${condIcon}</span>
              <span>${getLocalizedLocationName(pt.name, language).slice(0, 6)}: ${temp}°</span>
            </div>
          `,
          iconSize: [68, 24],
          iconAnchor: [34, 12],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([pt.latitude, pt.longitude], { icon: satIcon });
        marker.bindPopup(popupHtml);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`ask-btn-${pt.id}`);
          if (btn) {
            btn.onclick = () => {
              onLocationChange?.({
                name: pt.name,
                country: 'India',
                latitude: pt.latitude,
                longitude: pt.longitude,
              });
              onOpenChat?.(`Give me satellite & radar analysis for ${pt.name}`);
            };
          }
        });
        group.addLayer(marker);
      }
    });
  }, [currentLayer, currentHour, gridData, mode, onLocationChange, onOpenChat, language]);

  // 5. Update Current Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;

    if (currentMarkerRef.current) {
      currentMarkerRef.current.remove();
    }

    const currentPinIcon = L.divIcon({
      className: 'current-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute h-8 w-8 rounded-full bg-rose-500/30 animate-ping"></span>
          <div class="relative h-6 w-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const marker = L.marker([currentLocation.latitude, currentLocation.longitude], {
      icon: currentPinIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    const hierarchySubtitle = [
      currentLocation.admin2,
      currentLocation.admin1,
      getLocalizedCountry(currentLocation.country, language),
    ]
      .filter(Boolean)
      .join(', ');

    marker.bindPopup(`
      <div class="p-2.5 text-slate-800 font-sans text-xs">
        <div class="font-extrabold text-slate-900 flex items-center gap-1 text-sm">
          <span class="text-rose-500">📍</span> Selected Location
        </div>
        <div class="font-bold text-blue-600 mt-0.5">${getLocalizedLocationName(currentLocation, language)}</div>
        ${hierarchySubtitle ? `<div class="text-[11px] text-slate-500">${hierarchySubtitle}</div>` : ''}
        <div class="text-[10px] text-slate-400 mt-1 font-mono">${currentLocation.latitude.toFixed(4)}°N, ${currentLocation.longitude.toFixed(4)}°E</div>
      </div>
    `);

    currentMarkerRef.current = marker;

    // Smoothly pan or adapt view to selected location at appropriate natural zoom
    const currentZoom = map.getZoom();
    const targetZoom = Math.min(Math.max(currentZoom, mode === 'compact' ? 5.5 : 7.0), 10);
    map.flyTo([currentLocation.latitude, currentLocation.longitude], targetZoom, {
      duration: 1.2,
    });
  }, [currentLocation, language, mode]);

  // Map Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetIndiaView = () => {
    mapInstanceRef.current?.flyTo(INDIA_CENTER, mode === 'compact' ? 4.2 : INDIA_DEFAULT_ZOOM, {
      duration: 1.2,
    });
  };

  const handleMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const currentZoom = mapInstanceRef.current?.getZoom() || 7;
        const targetZoom = Math.min(Math.max(currentZoom, 7), 10);
        mapInstanceRef.current?.flyTo([latitude, longitude], targetZoom, { duration: 1.2 });

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.location) {
              onLocationChange?.(data.location);
              return;
            }
          }
        } catch {}

        onLocationChange?.({
          name: `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          country: 'India',
          country_code: 'IN',
          latitude,
          longitude,
        });
      },
      (err) => {
        console.warn('Geolocation permission denied:', err.message);
        setGeoError('Location access was denied. Search for a location.');
        setTimeout(() => setGeoError(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* ======================================================== */}
      {/* TOOLBAR CONTROLS (Layer Switcher & Status)                */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Layer Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-xs max-w-full overflow-x-auto">
          {(
            [
              { id: 'satellite', label: t.maps.layerSatellite, icon: Layers },
              { id: 'rainfall', label: t.maps.layerRainfall, icon: CloudRain },
              { id: 'temp', label: t.maps.layerTemperature, icon: Thermometer },
              { id: 'wind', label: t.maps.layerWind, icon: Wind },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectLayer(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#1d68f5] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right status info & refresh */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {gridData?.updatedAt && (
            <span className="hidden sm:inline text-[11px]">
              {t.dashboard.updatedAt}: <strong>{gridData.updatedAt}</strong>
            </span>
          )}

          <button
            onClick={() => loadGridData(true)}
            disabled={loadingGrid}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title="Refresh India live data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingGrid ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Geolocation feedback alert if denied */}
      {geoError && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <span>{geoError}</span>
          <button onClick={() => setGeoError(null)} className="font-bold text-amber-900 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* LEAFLET MAP CONTAINER                                    */}
      {/* ======================================================== */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${
          heightClass || (mode === 'compact' ? 'h-72' : 'h-[520px]')
        }`}
      >
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Loading overlay */}
        {loadingGrid && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-lg border border-slate-200 text-xs font-bold text-slate-700">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading India weather data...</span>
            </div>
          </div>
        )}

        {/* Top-Right Custom Map Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 shadow-md rounded-xl overflow-hidden bg-white/90 backdrop-blur-sm border border-slate-200/90 p-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors font-bold text-sm"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors font-bold text-sm"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleResetIndiaView}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            title="Reset India View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleMyLocation}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            title="Locate My Position"
          >
            <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
          </button>
        </div>

        {/* Floating Information Badge */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200/90 text-slate-800 text-xs flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Active Layer</div>
            <div className="font-extrabold capitalize text-blue-600">
              {currentLayer === 'satellite'
                ? t.maps.layerSatellite
                : currentLayer === 'rainfall'
                ? t.maps.layerRainfall
                : currentLayer === 'temp'
                ? t.maps.layerTemperature
                : t.maps.layerWind}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.maps.monitoredRegions}</div>
            <div className="font-bold text-slate-700">All-India Grid (24 Regions)</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DYNAMIC MAP LEGEND                                       */}
      {/* ======================================================== */}
      <div className="mt-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {currentLayer === 'rainfall' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Rainfall Legend:
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" /> 0 mm (Dry)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> Light (&lt;1mm)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" /> Moderate (1–3mm)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" /> Heavy (3–8mm)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Very Heavy (8–15mm)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7e22ce]" /> Extreme (&gt;15mm)
            </span>
          </div>
        )}

        {currentLayer === 'temp' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Temperature Legend:
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> Cold (&lt;18°C)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06b6d4]" /> Cool (18–24°C)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Normal (24–30°C)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Warm (30–35°C)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ea580c]" /> Hot (35–40°C)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b91c1c]" /> Extreme Heat (&gt;40°C)
            </span>
          </div>
        )}

        {currentLayer === 'wind' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Wind Legend:
            </span>
            <span className="text-[11px] text-slate-600">
              Directional vectors (↑) indicate prevailing direction; values in km/h from surface anemometers (10m).
            </span>
          </div>
        )}

        {currentLayer === 'satellite' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Satellite Imagery:
            </span>
            <span className="text-[11px] text-slate-600">
              High-resolution Earth observation tiles provided by ESRI World Imagery with live weather overlays.
            </span>
          </div>
        )}

        <div className="text-[11px] text-slate-400">
          Click any point or city for details
        </div>
      </div>

      {/* ======================================================== */}
      {/* FORECAST TIMELINE CONTROL (Full Mode or when enabled)    */}
      {/* ======================================================== */}
      {mode === 'full' && (
        <div className="mt-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">{t.forecast.hourlyTitle}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {t.forecast.hourlyScrollHint}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((hOffset) => {
              const isActive = currentHour === hOffset;
              const dateTarget = new Date(Date.now() + hOffset * 3600 * 1000);
              const label =
                hOffset === 0
                  ? t.weather.now.toUpperCase()
                  : dateTarget.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      hour12: true,
                    });

              return (
                <button
                  key={hOffset}
                  onClick={() => handleSelectHour(hOffset)}
                  className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                    isActive
                      ? 'bg-[#1d68f5] text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>{label}</div>
                  <div className={`text-[10px] font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {hOffset === 0 ? t.weather.now : `+${hOffset}h`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
