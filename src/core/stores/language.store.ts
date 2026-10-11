import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LANGUAGE, loadLanguage, normalizeLanguage } from '../i18n';

interface LanguageState {
  // null = follow the tenant's UI.Locale; a string = the viewer's explicit choice, which wins.
  language: string | null;
  setLanguage: (language: string | null) => Promise<void>;
}

// The viewer's own UI-language preference, per browser. Separate from site settings (tenant-wide,
// admin-controlled) because a French tenant can still have an English-speaking accountant.
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: null,
      setLanguage: async (language) => {
        const next = language ? normalizeLanguage(language) : null;
        set({ language: next });
        await loadLanguage(next ?? DEFAULT_LANGUAGE);
      },
    }),
    { name: 'admin_language' }
  )
);

// Resolves what the UI should show right now: explicit choice, else tenant locale's language.
export const resolveLanguage = (tenantLocale?: string | null): string => {
  const chosen = useLanguageStore.getState().language;
  if (chosen) return chosen;
  return normalizeLanguage((tenantLocale ?? DEFAULT_LANGUAGE).split('-')[0]);
};
