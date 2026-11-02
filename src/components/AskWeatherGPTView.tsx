'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  MapPin,
  AlertCircle,
  Clock,
  Trash2,
  User,
  History as HistoryIcon,
  PanelLeftOpen,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import { ChatMessage, GeoLocation } from '@/lib/types';
import { WeatherSummaryCard } from './WeatherSummaryCard';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getLocalizedLocationName, getLocalizedCountry } from '@/lib/i18n/locations';

// Voice & History Imports
import { VoiceStatus } from './chat/VoiceStatus';
import { GnaniSttButton, GnaniSttState } from './chat/GnaniSttButton';
import { sanitizeTextForSpeech } from '@/lib/voice/speechSanitizer';
import { ChatHistorySidebar } from './chat/ChatHistorySidebar';
import { GeminiLiveClient, VoiceState, TurnData } from '@/lib/voice/GeminiLiveClient';
import { Conversation } from '@/lib/history/types';
import { createClient } from '@/lib/supabase/client';
import { generateDeterministicTitle } from '@/lib/history/storage';
import {
  loadUserConversations,
  saveUserConversation,
  deleteUserConversation,
  clearAllUserConversations,
  getUserActiveConversationId,
  setUserActiveConversationId,
  migrateLegacyLocalStorageIfOwned,
} from '@/lib/history/supabase-storage';

interface AskWeatherGPTViewProps {
  currentLocation: GeoLocation;
  pendingInitialQuestion?: string;
  onClearInitialQuestion?: () => void;
  onLocationChange?: (loc: GeoLocation) => void;
}

type GnaniTtsState = 'idle' | 'generating' | 'ready' | 'speaking' | 'error';

const GNANI_TIMBRE_LANGUAGE_CODES: Record<string, string> = {
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

export const AskWeatherGPTView: React.FC<AskWeatherGPTViewProps> = ({
  currentLocation,
  pendingInitialQuestion,
  onClearInitialQuestion,
  onLocationChange,
}) => {
  const { language, t } = useTranslation();

  // History State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  conversationsRef.current = conversations;
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isDesktopHistoryOpen, setIsDesktopHistoryOpen] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(t.chat.stageChecking);

  // Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceInterimTranscript, setVoiceInterimTranscript] = useState('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState('');
  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const [gnaniSttState, setGnaniSttState] = useState<GnaniSttState>('idle');
  const [gnaniSttMessage, setGnaniSttMessage] = useState('');
  const [gnaniTranscript, setGnaniTranscript] = useState('');
  const [gnaniTtsState, setGnaniTtsState] = useState<GnaniTtsState>('idle');
  const [gnaniTtsMessage, setGnaniTtsMessage] = useState('');
  const gnaniAudioRef = useRef<HTMLAudioElement | null>(null);
  const gnaniAudioUrlRef = useRef<string | null>(null);
  const gnaniTtsRequestRef = useRef<AbortController | null>(null);
  const gnaniTtsTextRef = useRef<string>('');
  const gnaniTtsLanguageRef = useRef<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedQuestions = [
    { text: t.chat.qRain24h, emoji: '🌧️' },
    { text: t.chat.qTempToday, emoji: '🌡️' },
    { text: t.chat.qTomorrow, emoji: '☀️' },
    { text: t.chat.qUmbrella, emoji: '☔' },
    { text: t.chat.qWind, emoji: '💨' },
    { text: t.chat.qTonight, emoji: '🌙' },
  ];

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, voiceState, voiceInterimTranscript]);

  // Load user conversations from Supabase and restore active chat on mount
  useEffect(() => {
    const supabase = createClient();

    const initHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          userIdRef.current = null;
          setConversations([]);
          setMessages([]);
          activeConversationIdRef.current = null;
          setActiveConvId(null);
          savedMessageIdsRef.current.clear();
          return;
        }

        userIdRef.current = user.id;

        // Attempt safe legacy migration (only if owned by current user session)
        await migrateLegacyLocalStorageIfOwned(supabase, user.id);

        // Load user-specific conversations from Supabase
        const userConvs = await loadUserConversations(supabase, user.id);
        setConversations(userConvs);

        // Track all loaded message IDs to prevent duplicates
        const msgIds = new Set<string>();
        for (const c of userConvs) {
          for (const m of c.messages) {
            msgIds.add(m.id);
          }
        }
        savedMessageIdsRef.current = msgIds;

        // Restore user's active conversation if valid
        const savedActiveId = getUserActiveConversationId(user.id);
        if (savedActiveId) {
          const found = userConvs.find((c) => c.id === savedActiveId);
          if (found) {
            activeConversationIdRef.current = found.id;
            setActiveConvId(found.id);
            setMessages(found.messages);
            if (found.location && onLocationChange) {
              if (
                found.location.name !== currentLocation.name ||
                found.location.country !== currentLocation.country
              ) {
                onLocationChange(found.location);
              }
            }
          } else {
            setUserActiveConversationId(user.id, null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize user chat history:', err);
        setConversations([]);
      }
    };

    initHistory();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        userIdRef.current = null;
        setConversations([]);
        setMessages([]);
        activeConversationIdRef.current = null;
        setActiveConvId(null);
        savedMessageIdsRef.current.clear();
      } else if (session?.user && session.user.id !== userIdRef.current) {
        userIdRef.current = session.user.id;
        setConversations([]);
        setMessages([]);
        activeConversationIdRef.current = null;
        setActiveConvId(null);
        savedMessageIdsRef.current.clear();
        await initHistory();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [onLocationChange, currentLocation.name, currentLocation.country]);

  // Sync messages into the active conversation and Supabase
  const syncToActiveConversation = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages(newMessages);

      if (newMessages.length === 0) return;

      const currentUserId = userIdRef.current;
      if (!currentUserId) {
        console.warn('Cannot persist chat to Supabase: No authenticated user session.');
        return;
      }

      const supabase = createClient();

      let currentId = activeConversationIdRef.current;
      if (!currentId) {
        currentId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        activeConversationIdRef.current = currentId;
        setActiveConvId(currentId);
        setUserActiveConversationId(currentUserId, currentId);
      }

      // Preserve existing conversation title if one already exists for this ID
      const existingConv = conversationsRef.current.find((c) => c.id === currentId);
      const title =
        existingConv?.title ||
        generateDeterministicTitle(
          newMessages[0]?.content || '',
          currentLocation.name
        );

      const conv: Conversation = {
        id: currentId,
        title,
        createdAt: existingConv?.createdAt || Date.now(),
        updatedAt: Date.now(),
        location: currentLocation,
        language,
        messages: newMessages,
      };

      // Identify messages that have NOT been inserted to Supabase yet
      const messagesToInsert = newMessages.filter((m) => !savedMessageIdsRef.current.has(m.id));

      // Immediately mark them in ref to prevent double inserts from concurrent turns
      for (const m of messagesToInsert) {
        savedMessageIdsRef.current.add(m.id);
      }

      // Update local React state optimistically so UI is instant and smooth
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === currentId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = conv;
          return copy.sort((a, b) => b.updatedAt - a.updatedAt);
        } else {
          return [conv, ...prev];
        }
      });

      // Persist asynchronously to Supabase
      saveUserConversation(supabase, currentUserId, conv, messagesToInsert).catch((err) => {
        console.error('Failed to save conversation to Supabase:', err);
      });
    },
    [currentLocation, language]
  );

  // Handle pending initial question passed from TopNav or Dashboard
  useEffect(() => {
    if (pendingInitialQuestion && pendingInitialQuestion.trim().length > 0) {
      sendMessage(pendingInitialQuestion.trim());
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    } else {
      // Focus textarea for immediate user input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [pendingInitialQuestion]);

  // Stop voice mode when ESC key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && liveClientRef.current) {
        if (voiceState !== 'idle') {
          stopVoice();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState]);

  // Cleanup voice resources on component unmount
  useEffect(() => {
    return () => {
      if (liveClientRef.current) {
        liveClientRef.current.stop();
      }
    };
  }, []);

  const releaseGnaniAudio = useCallback(() => {
    const audio = gnaniAudioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;
      audio.src = '';
      gnaniAudioRef.current = null;
    }

    if (gnaniAudioUrlRef.current) {
      URL.revokeObjectURL(gnaniAudioUrlRef.current);
      gnaniAudioUrlRef.current = null;
    }
  }, []);

  const stopGnaniSpeech = useCallback(
    (message = '') => {
      gnaniTtsRequestRef.current?.abort();
      gnaniTtsRequestRef.current = null;
      releaseGnaniAudio();
      setGnaniTtsState('idle');
      setGnaniTtsMessage(message);
    },
    [releaseGnaniAudio]
  );

  const playGnaniSpeech = useCallback(async () => {
    const audio = gnaniAudioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      if (gnaniAudioRef.current === audio) {
        setGnaniTtsState('speaking');
        setGnaniTtsMessage('Speaking the WeatherGPT response.');
      }
    } catch {
      if (gnaniAudioRef.current === audio) {
        setGnaniTtsState('ready');
        setGnaniTtsMessage('Audio is ready. Tap Play to hear the response.');
      }
    }
  }, []);

  const speakWithGnaniTimbre = useCallback(
    async (text: string, languageCode: string) => {
      stopGnaniSpeech();

      // Convert Markdown and weather metrics into clean, natural spoken phrases
      const cleanSpeechText = sanitizeTextForSpeech(text, languageCode);
      if (!cleanSpeechText) return;

      gnaniTtsTextRef.current = cleanSpeechText;
      gnaniTtsLanguageRef.current = languageCode;
      setGnaniTtsState('generating');
      setGnaniTtsMessage('Creating a spoken response with Gnani Timbre...');

      const controller = new AbortController();
      gnaniTtsRequestRef.current = controller;

      try {
        const response = await fetch('/api/gnani/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanSpeechText, languageCode }),
          signal: controller.signal,
        });
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          const data = contentType.includes('application/json')
            ? await response.json().catch(() => ({}))
            : {};
          throw new Error(data.error || 'Voice playback could not be generated.');
        }
        if (!contentType.toLowerCase().startsWith('audio/wav')) {
          throw new Error('Voice playback returned an unsupported audio format.');
        }

        const audioBlob = await response.blob();
        if (!audioBlob.size) {
          throw new Error('Voice playback returned empty audio.');
        }
        if (gnaniTtsRequestRef.current !== controller) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        gnaniAudioUrlRef.current = audioUrl;
        gnaniAudioRef.current = audio;
        gnaniTtsRequestRef.current = null;

        audio.onplaying = () => {
          if (gnaniAudioRef.current === audio) {
            setGnaniTtsState('speaking');
            setGnaniTtsMessage('Speaking the WeatherGPT response.');
          }
        };
        audio.onended = () => {
          if (gnaniAudioRef.current === audio) {
            releaseGnaniAudio();
            setGnaniTtsState('idle');
            setGnaniTtsMessage('');
          }
        };
        audio.onerror = () => {
          if (gnaniAudioRef.current === audio) {
            releaseGnaniAudio();
            setGnaniTtsState('error');
            setGnaniTtsMessage('The generated audio could not be played. Try again.');
          }
        };

        await playGnaniSpeech();
      } catch (error) {
        if (controller.signal.aborted) return;
        if (gnaniTtsRequestRef.current === controller) {
          gnaniTtsRequestRef.current = null;
        }
        setGnaniTtsState('error');
        setGnaniTtsMessage(
          error instanceof Error ? error.message : 'Voice playback could not be generated. Please try again.'
        );
      }
    },
    [playGnaniSpeech, releaseGnaniAudio, stopGnaniSpeech]
  );

  useEffect(() => {
    return () => stopGnaniSpeech();
  }, [stopGnaniSpeech]);

  // Text message sender (preserves existing text chat behavior exactly)
  const sendMessage = async (textToSend: string, options: { speakWithGnani?: boolean } = {}) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    stopGnaniSpeech();

    // If voice was active, stop voice before sending text
    if (voiceState !== 'idle') {
      stopVoice();
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    syncToActiveConversation(newHistory);
    setInputValue('');
    setLoading(true);

    setLoadingStage(t.chat.stageChecking);
    const timer = setTimeout(() => {
      setLoadingStage(t.chat.stageAnalyzing);
    }, 1200);

    try {
      const apiHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: apiHistory.slice(0, -1),
          locationContext: {
            name: currentLocation.name,
            country: currentLocation.country,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            admin1: currentLocation.admin1,
            admin2: currentLocation.admin2,
            state: currentLocation.state || currentLocation.admin1,
            district: currentLocation.district || currentLocation.admin2,
          },
          language,
        }),
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (data.location && onLocationChange) {
        if (
          data.location.name !== currentLocation.name ||
          data.location.country !== currentLocation.country
        ) {
          onLocationChange(data.location);
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "I couldn't format an answer. Please try again.",
        summaryCard: data.summaryCard,
        followUps: data.followUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isConfigError: data.isConfigError,
      };

      syncToActiveConversation([...newHistory, assistantMsg]);

      const timbreLanguageCode = GNANI_TIMBRE_LANGUAGE_CODES[language];
      if (options.speakWithGnani && timbreLanguageCode && !assistantMsg.isConfigError) {
        void speakWithGnaniTimbre(assistantMsg.content, timbreLanguageCode);
      }
    } catch (err: any) {
      clearTimeout(timer);
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I couldn't retrieve the latest weather right now. Please check your network connection and try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      syncToActiveConversation([...newHistory, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Real-Time Voice Conversation Controls
  const startVoice = async () => {
    stopGnaniSpeech();
    setVoiceState('connecting');
    setVoiceErrorMessage('');
    setVoiceInterimTranscript('');

    try {
      // 1. Request secure ephemeral token from server-side route
      const res = await fetch('/api/live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: currentLocation,
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server could not initialize live voice (${res.status})`
        );
      }

      const { token, model } = await res.json();

      // 2. Initialize GeminiLiveClient with ephemeral token
      const client = new GeminiLiveClient({
        language,
        onStateChange: (st) => setVoiceState(st),
        onError: (errMsg) => {
          setVoiceErrorMessage(errMsg);
          setVoiceState('error');
        },
        onTranscriptUpdate: (userTxt, assistantTxt) => {
          setVoiceInterimTranscript(assistantTxt || userTxt);
        },
        onTurnComplete: (turn: TurnData) => {
          // Unified Conversation: Save completed voice turns into chat history
          const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: turn.userText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: turn.assistantText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          const updated = [...messagesRef.current, userMsg, assistantMsg];
          setMessages(updated);
          syncToActiveConversation(updated);
          setVoiceInterimTranscript('');
        },
      });

      liveClientRef.current = client;
      await client.connect(token, model);
    } catch (err: any) {
      console.error('Failed to start voice mode:', err);
      setVoiceErrorMessage(err?.message || 'Unable to connect to Gemini Live voice.');
      setVoiceState('error');
    }
  };

  const stopVoice = useCallback(() => {
    if (liveClientRef.current) {
      liveClientRef.current.stop();
      liveClientRef.current = null;
    }
    setVoiceState('idle');
    setVoiceInterimTranscript('');
  }, []);

  // Handle ESC key to stop voice mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && voiceState !== 'idle') {
        stopVoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, stopVoice]);

  // Clean up voice session on component unmount
  useEffect(() => {
    return () => {
      if (liveClientRef.current) {
        liveClientRef.current.stop();
        liveClientRef.current = null;
      }
    };
  }, []);

  // Stop active voice session if language is switched
  const prevLanguageRef = useRef(language);
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      prevLanguageRef.current = language;
      if (liveClientRef.current && voiceState !== 'idle') {
        stopVoice();
      }
    }
  }, [language, voiceState, stopVoice]);

  const toggleVoice = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      startVoice();
    } else {
      stopVoice();
    }
  };

  // History Operations
  const handleSelectConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      stopGnaniSpeech();
      if (voiceState !== 'idle') stopVoice();
      activeConversationIdRef.current = conv.id;
      setActiveConvId(conv.id);
      if (userIdRef.current) {
        setUserActiveConversationId(userIdRef.current, conv.id);
      }
      setMessages(conv.messages);
      if (conv.location && onLocationChange) {
        onLocationChange(conv.location);
      }
    }
  };

  const handleNewChat = () => {
    stopGnaniSpeech();
    if (voiceState !== 'idle') stopVoice();
    activeConversationIdRef.current = null;
    setActiveConvId(null);
    if (userIdRef.current) {
      setUserActiveConversationId(userIdRef.current, null);
    }
    setMessages([]);
    setInputValue('');
    setVoiceInterimTranscript('');
    setVoiceErrorMessage('');
  };

  const handleDeleteConversation = async (id: string) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    const supabase = createClient();

    // Optimistically update React state
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationIdRef.current === id) {
      handleNewChat();
    }

    // Persist deletion to Supabase
    await deleteUserConversation(supabase, currentUserId, id);
  };

  const handleClearAllConversations = async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    const supabase = createClient();

    // Clear local state
    setConversations([]);
    handleNewChat();

    // Persist clear to Supabase
    await clearAllUserConversations(supabase, currentUserId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Left Chat History Sidebar */}
      <ChatHistorySidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onClearAll={handleClearAllConversations}
        isOpenMobile={isMobileHistoryOpen}
        onCloseMobile={() => setIsMobileHistoryOpen(false)}
        isOpenDesktop={isDesktopHistoryOpen}
        onToggleDesktop={() => setIsDesktopHistoryOpen(false)}
      />

      {/* Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden max-w-5xl mx-auto px-2.5 sm:px-6 py-3 sm:py-4 transition-all duration-300">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-indigo-500/20 mb-3 select-none flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile History Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileHistoryOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-slate-300 shadow-2xs flex-shrink-0"
              title="View Chat History"
            >
              <HistoryIcon className="h-4 w-4" />
            </button>

            {/* Desktop History Open Toggle (when collapsed) */}
            {!isDesktopHistoryOpen && (
              <button
                type="button"
                onClick={() => setIsDesktopHistoryOpen(true)}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#0e1834] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-indigo-500/20 text-slate-600 dark:text-slate-300 shadow-2xs transition-all animate-in fade-in duration-200 flex-shrink-0"
                title="Open Chat History"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex-shrink-0">
              AI
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                Ask WeatherGPT
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Open-Meteo
                </span>
                {voiceState !== 'idle' && (
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Gemini Live Voice
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[190px] sm:max-w-md">
                <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="truncate">
                  Current Context:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {getLocalizedLocationName(currentLocation, language)},{' '}
                    {getLocalizedCountry(currentLocation.country, language)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons: Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-200 transition-colors"
              title="Clear View and Start New Chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.chat.clearChat}</span>
            </button>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Welcome Greeting & Suggestion Cards when conversation is fresh */}
          {messages.length === 0 && (
            <div className="rounded-3xl glass-card p-6 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md text-xl">
                  🤖
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Hey! 👋 How can I help you today?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    I&apos;m <strong>WeatherGPT</strong> — your AI weather companion. Type a question
                    or click the purple microphone 🎙️ for <strong>multilingual voice conversation</strong> powered by Gnani AI.
                  </p>
                </div>
              </div>

              {/* Clickable Suggested Questions */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  {t.chat.suggestedHeading}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#070b19]/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all text-left shadow-2xs group"
                    >
                      <span className="text-base flex-shrink-0 group-hover:scale-110 transition-transform">
                        {q.emoji}
                      </span>
                      <span className="line-clamp-2">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Bubble List */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-sm text-sm">
                  🤖
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[75%] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/20'
                    : msg.isConfigError
                    ? 'bg-amber-50/90 dark:bg-amber-950/40 text-slate-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-bl-sm'
                    : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-bl-sm'
                    : 'bg-white dark:bg-[#0e1834]/85 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-indigo-500/20 rounded-bl-sm shadow-md'
                }`}
              >
                {msg.isConfigError && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 pb-1 border-b border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>Developer Configuration Notice</span>
                  </div>
                )}

                {msg.summaryCard && <WeatherSummaryCard data={msg.summaryCard} />}

                <div className="text-sm leading-relaxed prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                    {msg.followUps.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(fu)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-2xs"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] text-right ${
                    msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm text-xs font-semibold">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator for Text Queries */}
          {loading && (
            <div className="flex gap-3.5 justify-start animate-in fade-in duration-200">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-sm text-sm">
                🤖
              </div>
              <div className="rounded-3xl rounded-bl-sm bg-white dark:bg-[#0e1834] border border-slate-200/80 dark:border-indigo-500/20 p-4 shadow-sm text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                </div>
                <span>{loadingStage}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Box */}
        <div className="pt-3 flex-shrink-0">
          {/* Live Voice Status Pill above input */}
          <VoiceStatus
            state={voiceState}
            onStop={stopVoice}
            interimTranscript={voiceInterimTranscript}
            errorMessage={voiceErrorMessage}
          />

          {gnaniSttState !== 'idle' && (
            <div
              className={`mb-2 px-4 py-2 rounded-2xl border shadow-sm text-xs flex items-center gap-2 ${
                gnaniSttState === 'error'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300'
              }`}
              role="status"
            >
              <span className="font-semibold">Gnani Prisma:</span>
              <span>{gnaniSttMessage}</span>
            </div>
          )}

          {gnaniTtsState !== 'idle' && (
            <div
              className={`mb-2 px-4 py-2 rounded-2xl border shadow-sm text-xs flex items-center justify-between gap-3 ${
                gnaniTtsState === 'error'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
              }`}
              role="status"
            >
              <div className="flex items-center gap-2 min-w-0">
                {gnaniTtsState === 'error' ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Volume2 className={`h-4 w-4 flex-shrink-0 ${gnaniTtsState === 'speaking' ? 'animate-pulse' : ''}`} />
                )}
                <span className="font-semibold flex-shrink-0">Gnani Timbre:</span>
                <span className="truncate">{gnaniTtsMessage}</span>
              </div>

              {gnaniTtsState === 'ready' ? (
                <button
                  type="button"
                  onClick={() => void playGnaniSpeech()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-600 text-white hover:bg-sky-700 font-semibold flex-shrink-0"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Play
                </button>
              ) : gnaniTtsState === 'error' ? (
                <button
                  type="button"
                  onClick={() => void speakWithGnaniTimbre(gnaniTtsTextRef.current, gnaniTtsLanguageRef.current)}
                  disabled={!gnaniTtsTextRef.current || !gnaniTtsLanguageRef.current}
                  className="px-2.5 py-1 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 font-semibold flex-shrink-0"
                >
                  Retry
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopGnaniSpeech()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold flex-shrink-0"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Stop
                </button>
              )}
            </div>
          )}

          {gnaniTranscript && (
            <p className="mb-2 px-3 text-xs text-violet-700 dark:text-violet-400 truncate" title={gnaniTranscript}>
              Gnani heard: &ldquo;{gnaniTranscript}&rdquo;
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputValue);
            }}
            className="relative rounded-3xl bg-white dark:bg-[#0e1834] border border-slate-200/90 dark:border-indigo-500/30 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-1.5 sm:p-2 flex items-end gap-1.5 sm:gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chat.placeholder}
              disabled={
                gnaniSttState === 'recording' ||
                gnaniSttState === 'transcribing' ||
                (voiceState !== 'idle' && voiceState !== 'error')
              }
              className="flex-1 max-h-32 min-h-[38px] resize-none bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50"
            />

            {/* 🎙️ Purple Gnani Voice Button Immediately BEFORE Existing Send Button */}
            <GnaniSttButton
              language={language}
              disabled={loading}
              onStatusChange={({ state, message }) => {
                setGnaniSttState(state);
                setGnaniSttMessage(message);
              }}
              onTranscript={(transcript) => {
                setGnaniTranscript(transcript);
                sendMessage(transcript, { speakWithGnani: true });
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={
                !inputValue.trim() ||
                loading ||
                gnaniSttState === 'recording' ||
                gnaniSttState === 'transcribing' ||
                (voiceState !== 'idle' && voiceState !== 'error')
              }
              className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 transition-all"
              title="Send Message (Enter)"
            >
              <Send className="h-4 w-4 -rotate-12 translate-x-[-1px]" />
            </button>
          </form>

          <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 px-3 gap-1">
            <span>
              Press <strong>Enter</strong> to send, 🎙️ for <strong>Voice Mode</strong>
            </span>
            <span>Powered by Open-Meteo & Gnani AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
