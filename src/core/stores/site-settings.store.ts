import { create } from 'zustand';
import { applyLocale } from '../i18n';

export interface SiteSettingEntry {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

// The canonical keys the backend seeds (DefaultSiteSettingsSeeder). These MUST match exactly:
// the store previously looked for 'site_title'/'SiteTitle'/'siteTitle', none of which is the
// seeded 'Site.Title', so branding silently vanished on every page refresh.
export const BRANDING_KEYS = {
  title: 'Site.Title',
  logoUrl: 'Site.LogoUrl',
  tagline: 'Site.Tagline',
  faviconUrl: 'Site.FaviconUrl',
  brandColor: 'UI.BrandColor',
  supportEmail: 'Site.SupportEmail',
  locale: 'UI.Locale',
  timeZone: 'UI.TimeZone',
} as const;

export interface Branding {
  title: string | null;
  logoUrl: string | null;
  tagline: string | null;
  faviconUrl: string | null;
  brandColor: string | null;
  supportEmail: string | null;
  locale: string | null;
  timeZone: string | null;
}

// Pushes branding into the document itself -- the tab title, the favicon, and the CSS custom
// property every brand-colored element reads. Tailwind's palette is compile-time, so a runtime
// brand color has to travel through a CSS variable.
export const applyBranding = (branding: Partial<Branding>) => {
  if (branding.title) document.title = branding.title;

  if (branding.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }

  if (branding.locale) {
    applyLocale(branding.locale);
  }

  if (branding.brandColor) {
    document.documentElement.style.setProperty('--brand-color', branding.brandColor);
  }
};

interface SiteSettingsState {
  siteTitle: string;
  logoUrl: string;
  tagline: string;
  faviconUrl: string;
  brandColor: string;
  supportEmail: string;
  locale: string;
  timeZone: string;
  settings: SiteSettingEntry[];
  setSiteTitle: (title: string) => void;
  setBranding: (branding: Partial<Branding>) => void;
  setSettings: (settings: SiteSettingEntry[]) => void;
  getSettingValue: (key: string) => string | null;
}

export const useSiteSettingsStore = create<SiteSettingsState>()((set, get) => ({
  siteTitle: '',
  logoUrl: '',
  tagline: '',
  faviconUrl: '',
  brandColor: '',
  supportEmail: '',
  locale: '',
  timeZone: '',
  settings: [],
  setSiteTitle: (title) => {
    if (get().siteTitle !== title) {
      set({ siteTitle: title });
      if (title) document.title = title;
    }
  },
  setBranding: (branding) => {
    set({
      siteTitle: branding.title || get().siteTitle,
      logoUrl: branding.logoUrl || '',
      tagline: branding.tagline || '',
      faviconUrl: branding.faviconUrl || '',
      brandColor: branding.brandColor || '',
      supportEmail: branding.supportEmail || '',
      locale: branding.locale || '',
      timeZone: branding.timeZone || '',
    });
    applyBranding(branding);
  },
  setSettings: (settings) => {
    if (get().settings.length === settings.length && get().settings === settings) return;
    // Re-derives branding from the settings list on every load, so it survives a page refresh
    // rather than only being set once by the login response.
    const valueOf = (key: string) => settings.find(s => s.key === key)?.value || null;

    const branding: Partial<Branding> = {
      title: valueOf(BRANDING_KEYS.title),
      logoUrl: valueOf(BRANDING_KEYS.logoUrl),
      tagline: valueOf(BRANDING_KEYS.tagline),
      faviconUrl: valueOf(BRANDING_KEYS.faviconUrl),
      brandColor: valueOf(BRANDING_KEYS.brandColor),
      supportEmail: valueOf(BRANDING_KEYS.supportEmail),
      locale: valueOf(BRANDING_KEYS.locale),
      timeZone: valueOf(BRANDING_KEYS.timeZone),
    };

    set({
      settings,
      siteTitle: branding.title || get().siteTitle,
      logoUrl: branding.logoUrl || get().logoUrl,
      tagline: branding.tagline || get().tagline,
      faviconUrl: branding.faviconUrl || get().faviconUrl,
      brandColor: branding.brandColor || get().brandColor,
      supportEmail: branding.supportEmail || get().supportEmail,
      locale: branding.locale || get().locale,
      timeZone: branding.timeZone || get().timeZone,
    });

    applyBranding(branding);
  },
  getSettingValue: (key: string) => {
    const s = get().settings.find(s => s.key === key);
    return s?.value || null;
  },
}));
