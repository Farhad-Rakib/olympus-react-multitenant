import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n, { loadLanguage, unflatten, flatten, defaultEnglish, DEFAULT_LANGUAGE } from './index';
import { translationApi } from '../api/services/translation.api';

describe('i18n runtime bundles', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage(DEFAULT_LANGUAGE);
    if (i18n.hasResourceBundle('fr', 'translation')) i18n.removeResourceBundle('fr', 'translation');
  });

  it('nests flat DB keys into the i18next shape and back', () => {
    const nested = unflatten({ 'common.save': 'Enregistrer', 'a.b.c': 'x' });
    expect(nested).toEqual({ common: { save: 'Enregistrer' }, a: { b: { c: 'x' } } });
    expect(flatten(nested)).toEqual({ 'common.save': 'Enregistrer', 'a.b.c': 'x' });
  });

  it('exposes every bundled English key for the editor', () => {
    expect(defaultEnglish()['common.save']).toBe('Save');
  });

  // The whole point: a language never has to be complete. What the tenant translated shows, the
  // rest stays English instead of rendering raw keys.
  it('loads a partial language from the API and falls back to English per key', async () => {
    vi.spyOn(translationApi, 'getBundle').mockResolvedValue({ language: 'fr', entries: { 'common.save': 'Enregistrer' } });

    await loadLanguage('FR');

    expect(i18n.language).toBe('fr');
    expect(i18n.t('common.save')).toBe('Enregistrer');
    expect(i18n.t('common.cancel')).toBe('Cancel');
  });

  it('still switches language when the translation endpoint fails', async () => {
    vi.spyOn(translationApi, 'getBundle').mockRejectedValue(new Error('boom'));

    await loadLanguage('fr');

    expect(i18n.language).toBe('fr');
    expect(i18n.t('common.save')).toBe('Save');
  });

  it('never fetches English -- it is bundled', async () => {
    const spy = vi.spyOn(translationApi, 'getBundle');

    await loadLanguage('en');

    expect(spy).not.toHaveBeenCalled();
  });

  it('a later switch wins over a slower earlier one', async () => {
    let resolveFr!: (v: { language: string; entries: Record<string, string> }) => void;
    vi.spyOn(translationApi, 'getBundle').mockImplementation((lang) =>
      lang === 'fr'
        ? new Promise((r) => { resolveFr = r; })
        : Promise.resolve({ language: 'de', entries: { 'common.save': 'Speichern' } })
    );

    const slow = loadLanguage('fr');
    await loadLanguage('de');
    resolveFr({ language: 'fr', entries: { 'common.save': 'Enregistrer' } });
    await slow;

    expect(i18n.language).toBe('de');
    expect(i18n.t('common.save')).toBe('Speichern');
  });
});
