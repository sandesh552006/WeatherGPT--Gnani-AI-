'use client';

import React from 'react';
import { Square, Sparkles, Volume2, Mic, AlertCircle } from 'lucide-react';
import { VoiceState } from '@/lib/voice/GeminiLiveClient';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface VoiceStatusProps {
  state: VoiceState;
  onStop: () => void;
  interimTranscript?: string;
  errorMessage?: string;
}

export const VoiceStatus: React.FC<VoiceStatusProps> = ({
  state,
  onStop,
  interimTranscript,
  errorMessage,
}) => {
  const { t } = useTranslation();

  if (state === 'idle') return null;

  return (
    <div className="mb-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {state === 'connecting' && (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span>{t.chat.connecting}</span>
          </div>
        )}

        {state === 'listening' && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-rose-100 text-rose-600 flex-shrink-0">
              <Mic className="h-3 w-3 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-rose-600 block">
                {t.chat.listening}
              </span>
              <p className="text-[11px] text-slate-500 truncate">
                {interimTranscript || 'Speak naturally in your language...'}
              </p>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>{t.chat.thinking}</span>
          </div>
        )}

        {state === 'speaking' && (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex items-center gap-0.5 h-4 flex-shrink-0">
              <span className="w-1 h-3.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-blue-600 rounded-full animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-blue-700 block">
                {t.chat.speaking}
              </span>
              <p className="text-[11px] text-slate-600 truncate">
                {interimTranscript || 'WeatherGPT is replying with voice...'}
              </p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-center gap-2 min-w-0 flex-1 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="truncate">{errorMessage || 'Voice connection failed.'}</span>
          </div>
        )}
      </div>

      {/* Stop button */}
      <button
        type="button"
        onClick={onStop}
        className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-colors flex-shrink-0 shadow-2xs"
        title="Stop Voice (ESC)"
      >
        <Square className="h-3 w-3 fill-current" />
        <span className="hidden sm:inline">{t.chat.stopVoice}</span>
      </button>
    </div>
  );
};
