'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Mic, Square } from 'lucide-react';
import { MAX_GNANI_RECORDING_SECONDS, startWavRecording, WavRecording } from '@/lib/voice/browserWavRecorder';

export type GnaniSttState = 'idle' | 'recording' | 'transcribing' | 'error';

interface GnaniSttButtonProps {
  language: string;
  disabled?: boolean;
  onTranscript: (transcript: string) => void;
  onStatusChange: (status: { state: GnaniSttState; message: string }) => void;
}

const LANGUAGE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
};

function messageForRecordingError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Microphone permission was denied. Allow microphone access and try again.';
  }

  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'No microphone was found. Connect a microphone and try again.';
  }

  return error instanceof Error ? error.message : 'Unable to start the microphone. Please try again.';
}

export const GnaniSttButton: React.FC<GnaniSttButtonProps> = ({
  language,
  disabled = false,
  onTranscript,
  onStatusChange,
}) => {
  const [state, setState] = useState<GnaniSttState>('idle');
  const recordingRef = useRef<WavRecording | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const setStatus = (nextState: GnaniSttState, message: string) => {
    setState(nextState);
    onStatusChange({ state: nextState, message });
  };

  const stopAndTranscribe = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    recordingRef.current = null;
    clearAutoStopTimer();
    setStatus('transcribing', 'Transcribing your weather question with Gnani Prisma...');

    try {
      const audio = await recording.stop();
      const formData = new FormData();
      formData.append('audio', audio, 'weather-question.wav');
      formData.append('languageCode', LANGUAGE_CODES[language]);

      const response = await fetch('/api/gnani/stt', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Speech transcription failed. Please try again.');
      }

      const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
      if (!transcript) {
        throw new Error("I couldn't hear any speech. Try recording again a little closer to your microphone.");
      }

      setStatus('idle', 'Transcript ready.');
      onTranscript(transcript);
    } catch (error) {
      setStatus('error', messageForRecordingError(error));
    }
  };

  const startRecording = async () => {
    const languageCode = LANGUAGE_CODES[language];
    if (!languageCode) {
      setStatus(
        'error',
        'Gnani Prisma STT does not currently support the selected language. You can type your question or use Gemini Live voice.'
      );
      return;
    }

    try {
      setStatus('recording', `Listening... tap stop when you finish (up to ${MAX_GNANI_RECORDING_SECONDS} seconds).`);
      recordingRef.current = await startWavRecording();
      autoStopTimerRef.current = setTimeout(() => {
        void stopAndTranscribe();
      }, MAX_GNANI_RECORDING_SECONDS * 1000);
    } catch (error) {
      setStatus('error', messageForRecordingError(error));
    }
  };

  const toggle = () => {
    if (state === 'recording') {
      void stopAndTranscribe();
      return;
    }

    if (state === 'idle' || state === 'error') {
      void startRecording();
    }
  };

  useEffect(() => {
    return () => {
      clearAutoStopTimer();
      if (recordingRef.current) {
        void recordingRef.current.stop().catch(() => undefined);
        recordingRef.current = null;
      }
    };
  }, []);

  const isBusy = state === 'recording' || state === 'transcribing';
  const isDisabled = disabled && !isBusy;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isDisabled || state === 'transcribing'}
      className={`relative h-10 w-10 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none ${
        state === 'recording'
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-300'
          : state === 'transcribing'
          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
          : state === 'error'
          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
          : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
      }`}
      title={
        state === 'recording'
          ? 'Stop Gnani recording'
          : state === 'transcribing'
          ? 'Transcribing with Gnani Prisma'
          : state === 'error'
          ? 'Retry Gnani transcription'
          : 'Record a voice question with Gnani Prisma'
      }
      aria-label="Record a voice question with Gnani Prisma"
    >
      {state === 'recording' && (
        <span className="absolute -inset-1 rounded-2xl bg-rose-400/30 animate-ping pointer-events-none" />
      )}
      {state === 'transcribing' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === 'recording' ? (
        <Square className="h-3.5 w-3.5 fill-current" />
      ) : state === 'error' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Mic className="h-4.5 w-4.5" />
      )}
    </button>
  );
};
