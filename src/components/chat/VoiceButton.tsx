'use client';

import React from 'react';
import { Mic, MicOff, Square, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { VoiceState } from '@/lib/voice/GeminiLiveClient';

interface VoiceButtonProps {
  state: VoiceState;
  onToggle: () => void;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  state,
  onToggle,
  disabled = false,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';
  const isConnecting = state === 'connecting';
  const isError = state === 'error';
  const isActive = isListening || isSpeaking || isProcessing;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled && !isActive}
      className={`relative h-10 w-10 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all duration-200 select-none ${
        isActive
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-300'
          : isConnecting
          ? 'bg-blue-50 text-blue-600 border border-blue-200'
          : isError
          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
          : 'bg-[#f1f5f9] hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200/80'
      } disabled:opacity-40 disabled:pointer-events-none`}
      title={
        isActive
          ? 'Stop Voice Mode (ESC)'
          : isConnecting
          ? 'Connecting Live Voice...'
          : isError
          ? 'Voice Error (Click to retry)'
          : 'Start Real-Time Voice Conversation'
      }
      aria-label="Real-time Voice Conversation"
    >
      {/* Active Pulse Animation Ring */}
      {isListening && (
        <span className="absolute -inset-1 rounded-2xl bg-rose-400/30 animate-ping pointer-events-none" />
      )}

      {/* Button Content by State */}
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      ) : isListening ? (
        <div className="flex items-center justify-center relative">
          <Mic className="h-4.5 w-4.5 text-white animate-pulse" />
        </div>
      ) : isSpeaking ? (
        <div className="flex items-center gap-0.5 h-4 text-white">
          <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-0.5 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-0.5 h-2 bg-white rounded-full animate-bounce" />
        </div>
      ) : isProcessing ? (
        <div className="flex space-x-0.5 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
        </div>
      ) : isError ? (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      ) : (
        <Mic className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
};
