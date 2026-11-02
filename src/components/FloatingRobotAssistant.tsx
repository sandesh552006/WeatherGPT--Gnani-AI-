'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ArrowRight, CloudRain, Sun, Move } from 'lucide-react';
import { WeatherData } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface FloatingRobotAssistantProps {
  activeTab: string;
  weather?: WeatherData | null;
  onOpenChat: (initialQuestion?: string) => void;
}

const ROBOT_STORAGE_KEY = 'weathergpt_robot_pos_v2';
const ROBOT_SIZE = 80; // approximate width/height in px

export const FloatingRobotAssistant: React.FC<FloatingRobotAssistantProps> = ({
  activeTab,
  weather,
  onOpenChat,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);
  const [speechIndex, setSpeechIndex] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Position on screen { x, y } in px
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  // Pointer dragging refs
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null);
  const hasMovedRef = useRef(false);
  const robotContainerRef = useRef<HTMLDivElement>(null);

  // Initialize position (restoring from localStorage or default to bottom-right)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clampX = (x: number) => Math.max(16, Math.min(x, window.innerWidth - ROBOT_SIZE - 16));
    const clampY = (y: number) => Math.max(16, Math.min(y, window.innerHeight - ROBOT_SIZE - 16));

    try {
      const saved = localStorage.getItem(ROBOT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition({
            x: clampX(parsed.x),
            y: clampY(parsed.y),
          });
          return;
        }
      }
    } catch {}

    // Default: bottom-right corner
    setPosition({
      x: clampX(window.innerWidth - ROBOT_SIZE - 28),
      y: clampY(window.innerHeight - ROBOT_SIZE - 28),
    });
  }, []);

  // Window resize listener to keep robot in visible bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return {
          x: Math.max(16, Math.min(prev.x, window.innerWidth - ROBOT_SIZE - 16)),
          y: Math.max(16, Math.min(prev.y, window.innerHeight - ROBOT_SIZE - 16)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Contextual messages for speech bubble
  const getContextualMessages = () => {
    const locName = weather?.location?.name || 'India';
    const temp = weather?.current ? `${Math.round(weather.current.temperature)}°C` : '';

    const tabMessages: Record<string, string> = {
      dashboard: temp
        ? `Namaste! 👋 It's ${temp} in ${locName}. Need a weather update?`
        : `Namaste! 👋 Need a quick weather update for ${locName}?`,
      forecast: `Checking the forecast? Ask me about rain, wind, or clothing!`,
      maps: `Exploring radar maps? Want me to analyze heavy rain zones?`,
      alerts: `Need safety advice or emergency precautions for active alerts?`,
      sectoral: `Need agricultural, farming, or aviation weather advisories?`,
      climate: `Curious about 25-year climate trends or monsoon shifts?`,
      'ask-weathergpt': `I'm ready! Ask me anything in your language 💜`,
    };

    const generalMessages = [
      'Hello! 👋 How can I help you today?',
      'Should I check today’s rainfall? 🌧️',
      'Need help planning your trip or day? ✈️',
      'Want to know tomorrow’s forecast? 🌤️',
      'Drag me anywhere on your screen! 🖐️',
    ];

    const currentTabMsg = tabMessages[activeTab] || generalMessages[0];
    return [currentTabMsg, ...generalMessages];
  };

  const messages = getContextualMessages();
  const currentMessage = messages[speechIndex % messages.length];

  // Rotate messages gently every 9 seconds when not actively hovered or dragged
  useEffect(() => {
    if (isHovered || isBubbleDismissed || isDragging) return;
    const interval = setInterval(() => {
      setSpeechIndex((prev) => (prev + 1) % messages.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [isHovered, isBubbleDismissed, isDragging, messages.length]);

  // Occasional friendly greeting wave animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1800);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------
  // Pointer Drag Event Handlers (Support both Mouse & Touch seamlessly)
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with left mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const currentPos = position || {
      x: window.innerWidth - ROBOT_SIZE - 28,
      y: window.innerHeight - ROBOT_SIZE - 28,
    };

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: currentPos.x,
      startY: currentPos.y,
    };
    hasMovedRef.current = false;

    // Capture pointer so dragging is smooth even when moving fast outside the bounding box
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    // Distinguish between a clean click and a drag move
    if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const maxX = window.innerWidth - ROBOT_SIZE - 12;
      const maxY = window.innerHeight - ROBOT_SIZE - 12;

      const newX = Math.max(12, Math.min(dragStartRef.current.startX + deltaX, maxX));
      const newY = Math.max(12, Math.min(dragStartRef.current.startY + deltaY, maxY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const moved = hasMovedRef.current;
    dragStartRef.current = null;
    setIsDragging(false);

    if (!moved) {
      // User tapped or clicked without dragging -> Open Ask WeatherGPT
      onOpenChat();
    } else {
      // User finished dragging -> Persist position in localStorage
      if (position) {
        try {
          localStorage.setItem(ROBOT_STORAGE_KEY, JSON.stringify(position));
        } catch {}
      }
    }
  };

  const handleQuickPrompt = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChat(q);
  };

  if (!position) return null;

  // Determine intelligent speech bubble placement based on current position
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const isRightSide = position.x > winW / 2;
  const isBottomSide = position.y > winH / 2;

  // Horizontal alignment of speech bubble
  const bubbleHorizontalClass = isRightSide ? 'right-0' : 'left-0';
  // Vertical placement: above robot if on lower half, below robot if on upper half
  const bubbleVerticalClass = isBottomSide
    ? 'bottom-full mb-3 origin-bottom-right'
    : 'top-full mt-3 origin-top-left';

  return (
    <div
      ref={robotContainerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-50 select-none ${
        isDragging ? 'cursor-grabbing transition-none' : 'cursor-grab transition-transform duration-75'
      }`}
    >
      {/* Speech Bubble (Follows the robot anywhere on screen) */}
      <div
        className={`absolute ${bubbleVerticalClass} ${bubbleHorizontalClass} w-[260px] sm:w-[290px] transition-all duration-300 pointer-events-auto ${
          (isHovered || (!isBubbleDismissed && speechIndex >= 0)) && !isDragging
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-3.5 rounded-2xl bg-white/95 dark:bg-[#0c142c]/95 border border-slate-200/90 dark:border-indigo-500/40 shadow-2xl shadow-indigo-950/30 backdrop-blur-md text-left">
          {/* Close bubble button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsBubbleDismissed(true);
            }}
            className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss message"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1 pr-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-900 dark:text-white tracking-wide">
              WeatherGPT AI
            </span>
            <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/15 dark:bg-purple-500/20 px-1.5 py-0.2 rounded-full">
              Movable Assistant
            </span>
          </div>

          {/* Dynamic Message Content */}
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug font-medium">
            {currentMessage}
          </p>

          {/* Interactive Quick Prompts */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-purple-500/20 flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={(e) => handleQuickPrompt('Will it rain today?', e)}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/20 transition-all flex items-center gap-1"
            >
              <CloudRain className="h-2.5 w-2.5 text-sky-500 dark:text-sky-400" />
              <span>Rain check</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleQuickPrompt('What is the weather forecast for tomorrow?', e)}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/20 transition-all flex items-center gap-1"
            >
              <Sun className="h-2.5 w-2.5 text-amber-500 dark:text-amber-400" />
              <span>Tomorrow</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChat()}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs hover:brightness-110 transition-all flex items-center gap-1 ml-auto"
            >
              <span>Ask AI</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Speech Bubble Arrow Tail */}
          <div
            className={`absolute w-3 h-3 bg-white dark:bg-[#0c142c] border-slate-200 dark:border-indigo-500/40 rotate-45 ${
              isBottomSide
                ? `-bottom-1.5 border-r border-b ${isRightSide ? 'right-7' : 'left-7'}`
                : `-top-1.5 border-l border-t ${isRightSide ? 'right-7' : 'left-7'}`
            }`}
          />
        </div>
      </div>

      {/* Draggable 3D Robot Figure */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsBubbleDismissed(false);
        }}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex items-center justify-center"
      >
        {/* Glow halo behind robot */}
        <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600/30 via-indigo-600/30 to-sky-400/20 rounded-full blur-xl group-hover:opacity-100 opacity-60 transition-opacity duration-300 animate-pulse pointer-events-none" />

        {/* Ambient floating container */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-200 ${
            isDragging
              ? 'scale-110 drop-shadow-2xl'
              : isHovered
              ? 'scale-105 -translate-y-1'
              : 'animate-float'
          }`}
        >
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full drop-shadow-[0_10px_20px_rgba(79,70,229,0.35)] pointer-events-none"
          >
            <defs>
              <radialGradient id="dragRobotGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="dragBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#e0e7ff" />
                <stop offset="100%" stopColor="#c7d2fe" />
              </linearGradient>
              <linearGradient id="dragArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="dragCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Floating Soft Cloud Base */}
            <ellipse cx="80" cy="144" rx="42" ry="11" fill="url(#dragRobotGlow)" />
            <path
              d="M52 142 C46 133 56 124 70 127 C76 120 92 120 98 127 C109 123 118 132 113 142 Z"
              fill="url(#dragCloudGrad)"
            />

            {/* Left Arm */}
            <path
              d="M48 94 C38 98 34 108 40 114 C44 117 50 112 50 106 Z"
              fill="url(#dragArmGrad)"
            />

            {/* Right Arm (Waving animation) */}
            <g className={isWaving || isHovered ? 'animate-wave origin-[112px_94px]' : ''}>
              <path
                d="M112 94 C122 98 126 108 120 114 C116 117 110 112 110 106 Z"
                fill="url(#dragArmGrad)"
              />
            </g>

            {/* Robot Body */}
            <rect
              x="52"
              y="80"
              width="56"
              height="44"
              rx="18"
              fill="url(#dragBodyGrad)"
              stroke="#6366f1"
              strokeWidth="2"
            />

            {/* Chest Screen with Sun/Cloud Emblem */}
            <rect
              x="62"
              y="91"
              width="36"
              height="22"
              rx="8"
              fill="#070b19"
              stroke="#818cf8"
              strokeWidth="1.2"
            />
            <circle cx="74" cy="99" r="4.5" fill="#f59e0b" className="animate-pulse" />
            <path d="M72 105 a6 6 0 0 1 12 0 z" fill="#38bdf8" />

            {/* Neck Joint */}
            <rect x="74" y="74" width="12" height="8" rx="3" fill="#6366f1" />

            {/* Robot Head */}
            <g className={isHovered ? 'rotate-2 origin-[80px_52px] transition-transform duration-300' : ''}>
              {/* Antenna */}
              <line x1="80" y1="28" x2="80" y2="16" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="80" cy="14" r="4.5" fill="#ec4899" className="animate-ping opacity-75" />
              <circle cx="80" cy="14" r="3.5" fill="#f43f5e" />

              {/* Head Casing */}
              <rect
                x="44"
                y="26"
                width="72"
                height="50"
                rx="22"
                fill="url(#dragBodyGrad)"
                stroke="#818cf8"
                strokeWidth="2.5"
              />

              {/* Visor / Face Screen */}
              <rect
                x="52"
                y="34"
                width="56"
                height="34"
                rx="14"
                fill="#050814"
                stroke="#4f46e5"
                strokeWidth="1.5"
              />

              {/* Blinking Eyes (Happy cyan arcs) */}
              <g className="animate-blink">
                <path
                  d="M62 52 Q69 44 76 52"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M84 52 Q91 44 98 52"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </g>

              {/* Cheek Blush */}
              <circle cx="58" cy="59" r="3" fill="#ec4899" opacity="0.65" />
              <circle cx="102" cy="59" r="3" fill="#ec4899" opacity="0.65" />
            </g>
          </svg>

          {/* Move handle indicator chip shown on hover */}
          <div
            className={`absolute -bottom-2 px-1.5 py-0.5 rounded-full bg-slate-900/90 dark:bg-indigo-950/90 border border-slate-700/80 dark:border-indigo-400/40 text-[9px] font-bold text-white flex items-center gap-1 shadow-md transition-opacity duration-200 pointer-events-none ${
              isHovered || isDragging ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Move className="h-2 w-2 text-indigo-400" />
            <span>Move</span>
          </div>

          {/* Notification sparkle badge */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 border border-white dark:border-[#070b19] items-center justify-center">
              <Sparkles className="h-2 w-2 text-white" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
