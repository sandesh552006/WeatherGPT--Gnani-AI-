import { SupportedLanguage, TranslationDictionary } from './types';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { mr } from './locales/mr';
import { gu } from './locales/gu';
import { ta } from './locales/ta';
import { te } from './locales/te';
import { ml } from './locales/ml';
import { kn } from './locales/kn';
import { bn } from './locales/bn';
import { pa } from './locales/pa';
import { or } from './locales/or';
import { as } from './locales/as';

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
  mr,
  gu,
  ta,
  te,
  ml,
  kn,
  bn,
  pa,
  or,
  as,
};
