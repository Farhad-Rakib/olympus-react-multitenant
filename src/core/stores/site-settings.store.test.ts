import { describe, it, expect, beforeEach } from 'vitest';
import { useSiteSettingsStore, BRANDING_KEYS, applyBranding } from './site-settings.store';

const reset = () =>
  useSiteSettingsStore.setState({
    siteTitle: '', logoUrl: '', tagline: '',
    faviconUrl: '', brandColor: '', supportEmail: '', settings: [],
  });

const setting = (key: string, value: string) => ({ id: 1, key, value, description: null });

describe('site settings branding', () => {
  beforeEach(() => {
    reset();
    document.title = 'Workspace';
  });

  // The regression this guards: the backend seeds "Site.Title" while the store used to look for
  // site_title / SiteTitle / siteTitle. Nothing matched, so branding silently vanished on every
  // page refresh and the tab fell back to the generic title.
  it('derives branding from the exact keys the backend seeds', () => {
    useSiteSettingsStore.getState().setSettings([
      setting(BRANDING_KEYS.title, 'Acme Corp'),
      setting(BRANDING_KEYS.tagline, 'We make things'),
      setting(BRANDING_KEYS.brandColor, '#ff0000'),
    ]);

    const state = useSiteSettingsStore.getState();
    expect(state.siteTitle).toBe('Acme Corp');
    expect(state.tagline).toBe('We make things');
    expect(state.brandColor).toBe('#ff0000');
  });

  it('uses Site.Title, not the snake_case variants that never matched', () => {
    expect(BRANDING_KEYS.title).toBe('Site.Title');

    useSiteSettingsStore.getState().setSettings([setting('site_title', 'Wrong Key')]);
    expect(useSiteSettingsStore.getState().siteTitle).toBe('');
  });

  it('keeps existing branding when a later load omits a key', () => {
    useSiteSettingsStore.getState().setBranding({ title: 'Acme Corp' });
    useSiteSettingsStore.getState().setSettings([setting(BRANDING_KEYS.tagline, 'Only a tagline')]);

    expect(useSiteSettingsStore.getState().siteTitle).toBe('Acme Corp');
  });

  it('sets the document title from branding', () => {
    useSiteSettingsStore.getState().setBranding({ title: 'Acme Corp' });
    expect(document.title).toBe('Acme Corp');
  });
});

describe('applyBranding', () => {
  beforeEach(() => {
    document.head.querySelectorAll("link[rel='icon']").forEach(el => el.remove());
    document.documentElement.style.removeProperty('--brand-color');
  });

  it('creates a favicon link when none exists', () => {
    applyBranding({ faviconUrl: '/logo.ico' });

    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    expect(link?.getAttribute('href')).toBe('/logo.ico');
  });

  it('reuses the existing favicon link rather than appending duplicates', () => {
    applyBranding({ faviconUrl: '/one.ico' });
    applyBranding({ faviconUrl: '/two.ico' });

    const links = document.querySelectorAll("link[rel='icon']");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/two.ico');
  });

  it('exposes the brand colour as a CSS custom property', () => {
    applyBranding({ brandColor: '#123456' });
    expect(document.documentElement.style.getPropertyValue('--brand-color')).toBe('#123456');
  });

  // Blank values are the seeded default (no favicon file ships), so they must not overwrite
  // anything or point the tab at an empty href.
  it('ignores blank values', () => {
    applyBranding({ faviconUrl: '', brandColor: '', title: '' });

    expect(document.querySelector("link[rel='icon']")).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--brand-color')).toBe('');
  });
});
