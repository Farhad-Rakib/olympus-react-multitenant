import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import { translationApi } from '../api/services/translation.api';

// English is the only BUNDLED language: it ships with the app and is the fallback for every key.
// Every other language is loaded at runtime from the tenant's own translation table
// (Translations page -> PUT /translations/{lang}); a key with no override falls through to the
// English string, so a partially translated language still renders fully.
export const DEFAULT_LANGUAGE = 'en';
export const NAMESPACE = 'translation';

i18n.use(initReactI18next).init({
  resources: { [DEFAULT_LANGUAGE]: { [NAMESPACE]: en } },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    // React escapes interpolated values already; doing it twice mangles apostrophes.
    escapeValue: false,
  },
});

// "common.save" -> { common: { save } }. Keys are validated server-side to dotted segments.
export const unflatten = (flat: Record<string, string>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.');
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const existing = node[parts[i]];
      if (typeof existing !== 'object' || existing === null) node[parts[i]] = {};
      node = node[parts[i]] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
};

// Every leaf path of the bundled English file -- the key list the Translations page edits.
export const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, string> =>
  Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(acc, flatten(v as Record<string, unknown>, path));
    else acc[path] = String(v);
    return acc;
  }, {});

export const defaultEnglish = (): Record<string, string> => flatten(en as unknown as Record<string, unknown>);

export const normalizeLanguage = (language?: string | null): string =>
  (language ?? DEFAULT_LANGUAGE).trim().toLowerCase() || DEFAULT_LANGUAGE;

// Fetches the tenant's overrides for a language and makes it the active one. A fetch failure is
// not fatal: the language still switches and English fills every key, which is strictly better
// than a stuck spinner over a translation endpoint.
let loadSequence = 0;
export const loadLanguage = async (language: string): Promise<void> => {
  const lang = normalizeLanguage(language);
  const seq = ++loadSequence;

  if (lang !== DEFAULT_LANGUAGE) {
    try {
      const bundle = await translationApi.getBundle(lang);
      // A later call superseded this one while the request was in flight; don't clobber it.
      if (seq !== loadSequence) return;
      i18n.addResourceBundle(lang, NAMESPACE, unflatten(bundle.entries), true, true);
    } catch {
      if (seq !== loadSequence) return;
      if (!i18n.hasResourceBundle(lang, NAMESPACE)) i18n.addResourceBundle(lang, NAMESPACE, {}, true, true);
    }
  }

  if (i18n.language !== lang) await i18n.changeLanguage(lang);
};

// Re-fetches the active language's overrides -- called after the Translations page saves so the
// editor's own chrome updates without a reload.
export const reloadActiveLanguage = () => loadLanguage(i18n.language);

// A tenant locale is a full BCP 47 tag ("en-GB"); formatting keeps the full tag (format.ts reads
// it from the site-settings store), while the UI language is the user's own choice when they have
// made one, otherwise the tenant locale's language.
export const applyLocale = (locale?: string | null) => {
  document.documentElement.lang = locale ?? DEFAULT_LANGUAGE;
};

export default i18n;
