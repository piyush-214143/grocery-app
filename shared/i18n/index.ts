import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import type { LanguageCode } from '../types';

export const i18nResources = {
  en: { translation: en },
  hi: { translation: hi },
};

// Each app (customer/owner) calls this once at startup with the language
// it already has persisted (Zustand + AsyncStorage), so i18next boots
// synchronously with the right language instead of flashing English first.
export function initI18n(initialLanguage: LanguageCode = 'en') {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: i18nResources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  }
  return i18n;
}

export { i18n };
