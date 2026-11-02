import { SupportedLanguage } from '@/lib/i18n/types';

export type PrebuiltVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Aoede' | 'Fenrir';

export interface VoiceLanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  voiceName: PrebuiltVoiceName;
  bcp47: string;
  instruction: string;
  isFullySupported: boolean;
}

/**
 * Centralized mapping of application languages to Gemini Live voices and prompt instructions.
 * Supports all 12 major Indian languages:
 * en = English, hi = Hindi, mr = Marathi, gu = Gujarati, ta = Tamil,
 * te = Telugu, ml = Malayalam, kn = Kannada, bn = Bengali, pa = Punjabi,
 * or = Odia, as = Assamese.
 */
export const VOICE_LANGUAGE_CONFIGS: Record<string, VoiceLanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    voiceName: 'Aoede',
    bcp47: 'en-IN',
    instruction:
      'The user selected English. Understand English speech and respond naturally in spoken English. Always answer in English unless the user explicitly requests another language. Keep your answers concise (2 to 3 sentences) suitable for a live voice conversation.',
    isFullySupported: true,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    voiceName: 'Kore',
    bcp47: 'hi-IN',
    instruction:
      'The user selected Hindi. Understand Hindi speech and respond naturally in Hindi. Always answer in Hindi unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Hindi and Devanagari script for any text. Keep your answers concise (2 to 3 sentences) suitable for live audio. If the user code-switches between Hindi and English, understand both but formulate your spoken response in natural Hindi.',
    isFullySupported: true,
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    voiceName: 'Charon',
    bcp47: 'mr-IN',
    instruction:
      'The user selected Marathi. Understand Marathi speech and respond naturally in Marathi. Always answer in Marathi unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Marathi. Keep your answers concise (2 to 3 sentences) suitable for live audio. If the user code-switches, understand both but formulate your response in natural Marathi.',
    isFullySupported: true,
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    voiceName: 'Kore',
    bcp47: 'gu-IN',
    instruction:
      'The user selected Gujarati. Understand Gujarati speech and respond naturally in Gujarati. Always answer in Gujarati unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Gujarati. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    voiceName: 'Aoede',
    bcp47: 'ta-IN',
    instruction:
      'The user selected Tamil. Understand Tamil speech and respond naturally in Tamil. Always answer in Tamil unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Tamil. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    voiceName: 'Aoede',
    bcp47: 'te-IN',
    instruction:
      'The user selected Telugu. Understand Telugu speech and respond naturally in Telugu. Always answer in Telugu unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Telugu. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    voiceName: 'Aoede',
    bcp47: 'ml-IN',
    instruction:
      'The user selected Malayalam. Understand Malayalam speech and respond naturally in Malayalam. Always answer in Malayalam unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Malayalam. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    voiceName: 'Aoede',
    bcp47: 'kn-IN',
    instruction:
      'The user selected Kannada. Understand Kannada speech and respond naturally in Kannada. Always answer in Kannada unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Kannada. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    voiceName: 'Kore',
    bcp47: 'bn-IN',
    instruction:
      'The user selected Bengali. Understand Bengali speech and respond naturally in Bengali. Always answer in Bengali unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Bengali. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    voiceName: 'Kore',
    bcp47: 'pa-IN',
    instruction:
      'The user selected Punjabi. Understand Punjabi speech and respond naturally in Punjabi. Always answer in Punjabi unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Punjabi. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    voiceName: 'Kore',
    bcp47: 'or-IN',
    instruction:
      'The user selected Odia. Understand Odia speech and respond naturally in Odia. Always answer in Odia unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Odia. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    voiceName: 'Kore',
    bcp47: 'as-IN',
    instruction:
      'The user selected Assamese. Understand Assamese speech and respond naturally in Assamese. Always answer in Assamese unless the user explicitly requests another language. Do not translate the response into English. Use polite, conversational spoken Assamese. Keep your answers concise (2 to 3 sentences) suitable for live audio.',
    isFullySupported: true,
  },
};

export function getVoiceConfigForLanguage(lang: string): VoiceLanguageConfig {
  return VOICE_LANGUAGE_CONFIGS[lang] || VOICE_LANGUAGE_CONFIGS.en;
}

/**
 * Prioritized Gemini Live Native Audio Models supported in v1beta.
 * Uses gemini-3.1-flash-live-preview as primary model.
 */
export const GEMINI_LIVE_MODELS = [
  'gemini-3.1-flash-live-preview',
  'gemini-live-2.5-flash-preview',
  'gemini-2.5-flash-native-audio-latest',
  'gemini-2.0-flash-live-preview-04-09',
];
