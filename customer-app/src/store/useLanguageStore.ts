import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguageCode } from '@grocery/shared';
import { i18n } from '@grocery/shared';

interface LanguageState {
  language: LanguageCode;
  hasChosenLanguage: boolean;
  setLanguage: (lang: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      hasChosenLanguage: false,
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang, hasChosenLanguage: true });
      },
    }),
    {
      name: 'customer-language',
      storage: createJSONStorage(() => AsyncStorage),
      // i18next boots with 'en' as a synchronous default (see @grocery/shared
      // initI18n); once AsyncStorage rehydrates a previously chosen
      // language, re-apply it so returning users don't see a flash of English.
      onRehydrateStorage: () => (state) => {
        if (state?.language) i18n.changeLanguage(state.language);
      },
    }
  )
);
