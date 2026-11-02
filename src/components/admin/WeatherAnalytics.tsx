'use client';

import React from 'react';
import {
  CloudSun,
  MapPin,
  Compass,
  Layers,
  Thermometer,
  Wind,
  Droplets,
  Database,
  BarChart2,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';

export const WeatherAnalytics: React.FC = () => {
  const popularLocations = [
    { city: 'New Delhi', state: 'Delhi', count: 'Live Default', temp: 'Grounding Active' },
    { city: 'Mumbai', state: 'Maharashtra', count: 'Coastal Feed', temp: 'IMD Station' },
    { city: 'Bengaluru', state: 'Karnataka', count: 'Highland Feed', temp: 'Real-time' },
    { city: 'Pune', state: 'Maharashtra', count: 'Western Ghats', temp: 'Real-time' },
    { city: 'Kolkata', state: 'West Bengal', count: 'Bay of Bengal', temp: 'Radar Active' },
    { city: 'Hyderabad', state: 'Telangana', count: 'Deccan Feed', temp: 'Real-time' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-sky-400" />
          <span>Weather Intelligence Analytics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Meteorological data pipelines, popular locations, and Open-Meteo / IMD query telemetry.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Forecast Grounding',
            value: 'Open-Meteo',
            desc: 'WMO 0.1° High-Resolution Model',
            icon: Thermometer,
            badge: 'Global',
          },
          {
            title: 'Alert Feed Source',
            value: 'IMD Official',
            desc: 'Ministry of Earth Sciences, Govt of India',
            icon: Radio,
            badge: 'India',
          },
          {
            title: 'Map Layer Server',
            value: 'OpenStreetMap',
            desc: 'Precipitation, Wind & Temperature Tiles',
            icon: Layers,
            badge: 'Leaflet',
          },
          {
            title: 'Geocoding Engine',
            value: 'Multilingual',
            desc: 'English, Hindi, and regional city aliases',
            icon: MapPin,
            badge: '12 Languages',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">{item.title}</span>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    {item.badge}
                  </span>
                </div>
                <div className="text-lg md:text-xl font-bold text-white tracking-tight">
                  {item.value}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
                <Icon className="h-4 w-4 text-sky-400" />
                <span className="text-[11px]">Real-time pipeline</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Locations and Telemetry Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Requested Regions */}
        <div className="lg:col-span-6 rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4 text-sky-400" />
            <span>Core Grounding Stations</span>
          </h3>
          <div className="space-y-2">
            {popularLocations.map((loc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{loc.city}</p>
                  <p className="text-[10px] text-slate-400">{loc.state}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    {loc.temp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Notice Card (Clean Real-Data Empty State) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="h-5 w-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Aggregated Weather Telemetry</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              WeatherGPT processes weather lookups dynamically via client and Next.js server proxies. To preserve client privacy and ensure ultra-low latency, individual search queries are not stored in a persistent telemetry table.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Next-Generation Telemetry Hook</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Weather analytics will automatically graph query volume, geographical heatmaps, and peak forecast intervals once an event tracking table (e.g. <code className="text-sky-300 font-mono">public.weather_analytics</code>) is provisioned.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Status: Telemetry ready</span>
            <span className="text-emerald-400 font-medium">● Data Streaming Clean</span>
          </div>
        </div>
      </div>
    </div>
  );
};
