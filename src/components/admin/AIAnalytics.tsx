'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  Mic,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  BarChart,
  Activity,
  Layers,
  Database,
} from 'lucide-react';
import { loadConversations } from '@/lib/history/storage';

export const AIAnalytics: React.FC = () => {
  const [localStats, setLocalStats] = useState<{
    sessionCount: number;
    messageCount: number;
    uniqueCities: number;
  }>({ sessionCount: 0, messageCount: 0, uniqueCities: 0 });

  useEffect(() => {
    try {
      const convs = loadConversations();
      const msgCount = convs.reduce((acc, c) => acc + (c.messages?.length || 0), 0);
      const cities = new Set(convs.map((c) => c.location?.name).filter(Boolean));
      setLocalStats({
        sessionCount: convs.length,
        messageCount: msgCount,
        uniqueCities: cities.size,
      });
    } catch {
      // Fallback
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="h-5 w-5 text-sky-400" />
          <span>Ask WeatherGPT & AI Analytics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Google Gemini 1.5 conversational models, Gemini Live voice streaming, and system instructions telemetry.
        </p>
      </div>

      {/* Model & Voice Configuration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Conversational LLM',
            value: 'Gemini 1.5 Flash',
            desc: 'Multi-turn meteorological grounding & advisories',
            icon: Bot,
            badge: 'Text Model',
          },
          {
            title: 'Voice Live Engine',
            value: 'Gemini Live',
            desc: 'Real-time bidirectional audio streaming via WebSockets',
            icon: Mic,
            badge: 'Audio Live',
          },
          {
            title: 'Ephemeral Token Auth',
            value: 'Server-Side',
            desc: 'Generates secure 30-min tokens in /api/live-token',
            icon: ShieldCheck,
            badge: 'Key Isolated',
          },
          {
            title: 'System Grounding',
            value: 'Strict Directives',
            desc: 'Enforces zero hallucination against Open-Meteo metrics',
            icon: Zap,
            badge: 'Truthful',
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
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {item.badge}
                  </span>
                </div>
                <div className="text-lg md:text-xl font-bold text-white tracking-tight">
                  {item.value}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
                <Icon className="h-4 w-4 text-indigo-400" />
                <span className="text-[11px]">Active AI Engine</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Client Sessions KPI Row */}
      <div className="rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Client-Side Session Storage (Local Device)</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">weathergpt_conversations_v1</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] uppercase font-bold text-slate-400">Saved Conversations</p>
            <p className="text-2xl font-black text-white mt-1">{localStats.sessionCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">On current browser instance</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Chat Messages</p>
            <p className="text-2xl font-black text-white mt-1">{localStats.messageCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">User & assistant turns</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] uppercase font-bold text-slate-400">Referenced Cities</p>
            <p className="text-2xl font-black text-white mt-1">{localStats.uniqueCities}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Distinct meteorological targets</p>
          </div>
        </div>
      </div>

      {/* Two-Column Telemetry & Architecture Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Pipeline Architecture */}
        <div className="lg:col-span-6 rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-sky-400" />
            <span>AI Inference Flow Architecture</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <p className="font-semibold text-slate-200">1. Grounding Retrieval</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Before the LLM generates a response, real weather metrics for the active coordinates are retrieved from Open-Meteo and injected into the prompt context.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <p className="font-semibold text-slate-200">2. Ephemeral Token Generation</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live voice sessions request temporary credentials via <code className="text-sky-300 font-mono">/api/live-token</code>, ensuring <code className="text-sky-300 font-mono">GEMINI_API_KEY</code> never touches the browser.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <p className="font-semibold text-slate-200">3. Multilingual System Instructions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Voice personas and instructions are customized per language (English, Hindi, Marathi, Gujarati, etc.) directly in the token payload.
              </p>
            </div>
          </div>
        </div>

        {/* Right: AI Telemetry Notice */}
        <div className="lg:col-span-6 rounded-2xl bg-[#091527]/80 backdrop-blur-xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Centralized Telemetry Status</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              User conversations and messages are persisted per authenticated user under Supabase Row Level Security (RLS) to guarantee strict privacy and cross-user isolation.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Database className="h-4 w-4 text-amber-400" />
                <span>Backend Telemetry Logging Table</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Centralized token usage, aggregate latency percentiles, and request volume charts will activate automatically if an opt-in audit table is connected to <code className="text-sky-300 font-mono">/api/chat</code>.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Voice Protocol: Ready</span>
            <span className="text-emerald-400 font-medium">● WebSocket Stream Configured</span>
          </div>
        </div>
      </div>
    </div>
  );
};
