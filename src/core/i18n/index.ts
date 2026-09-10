import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// English is the only bundled language today. The point of this module is that the wiring exists
// and the tenant's locale drives it -- adding a language is dropping a JSON file in ./locales and
// registering it here, not retrofitting i18n across the app.
export const SUPPORTED_LANGUAGES = ['en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    // React escapes interpolated values already; doing it twice mangles apostrophes.
    escapeValue: false,
  },
});

// A tenant locale is a full BCP 47 tag ("en-GB"), while translations are keyed by language ("en").
// Formatting keeps the full tag -- en-GB and en-US share strings but not date order.
export const applyLocale = (locale?: string | null) => {
  const language = (locale ?? 'en').split('-')[0] as SupportedLanguage;
  const supported = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';

  if (i18n.language !== supported) {
    i18n.changeLanguage(supported);
  }

  document.documentElement.lang = locale ?? 'en';
};

export default i18n;
