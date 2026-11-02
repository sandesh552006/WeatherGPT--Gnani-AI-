'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SupportedLanguage, TranslationDictionary, SUPPORTED_LANGUAGES } from './types';
import { translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  translateCondition: (conditionText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'weathergpt-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      const isValid = SUPPORTED_LANGUAGES.some((l) => l.code === saved);
      if (saved && isValid) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Unable to access localStorage for language preference:', e);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Unable to save language preference:', e);
    }
  };

  const t = useMemo(() => {
    const currentDict = translations[language] || translations.en;
    if (!currentDict.auth) {
      return {
        ...currentDict,
        auth: translations.en.auth,
      };
    }
    return currentDict;
  }, [language]);


  const translateCondition = (conditionText: string): string => {
    if (!conditionText) return '';
    const lower = conditionText.toLowerCase();

    if (lower.includes('thunder') || lower.includes('storm')) return t.conditions.thunderstorm;
    if (lower.includes('heavy rain') || lower.includes('torrential')) return t.conditions.heavyRain;
    if (lower.includes('drizzle') || lower.includes('light rain')) return t.conditions.drizzle;
    if (lower.includes('rain') || lower.includes('shower')) return t.conditions.rain;
    if (lower.includes('snow') || lower.includes('flurry')) return t.conditions.snow;
    if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return t.conditions.fog;
    if (lower.includes('overcast') || lower.includes('cloudy')) return t.conditions.overcast;
    if (lower.includes('partly')) return t.conditions.partlyCloudy;
    if (lower.includes('clear') || lower.includes('sunny')) return t.conditions.clear;

    return conditionText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateCondition }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      language: 'en' as SupportedLanguage,
      setLanguage: () => {},
      t: translations.en,
      translateCondition: (text: string) => text,
    };
  }
  return context;
};
