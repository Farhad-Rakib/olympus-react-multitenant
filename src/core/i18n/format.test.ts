import { describe, it, expect, beforeEach } from 'vitest';
import { useSiteSettingsStore } from '../stores/site-settings.store';
import { formatDate, formatDateTime, formatNumber, formatCurrency } from './format';

const setTenant = (locale: string, timeZone: string) =>
  useSiteSettingsStore.setState({ locale, timeZone });

describe('tenant-scoped formatting', () => {
  beforeEach(() => setTenant('en-US', 'UTC'));

  // The bug this replaces: dates went through toLocaleString() with no arguments, so the format
  // followed each viewer's browser rather than the tenant's configured locale.
  it('formats using the tenant locale, not the browser default', () => {
    setTenant('en-GB', 'UTC');
    const gb = formatDate('2026-03-04T00:00:00Z');

    setTenant('en-US', 'UTC');
    const us = formatDate('2026-03-04T00:00:00Z');

    expect(gb).not.toBe(us);
    expect(gb).toContain('2026');
    expect(us).toContain('2026');
  });

  // The API returns UTC; rendering in the viewer's own zone silently shifted timestamps.
  it('renders timestamps in the tenant time zone', () => {
    setTenant('en-US', 'UTC');
    const utc = formatDateTime('2026-03-04T23:30:00Z');

    setTenant('en-US', 'Asia/Tokyo');
    const tokyo = formatDateTime('2026-03-04T23:30:00Z');

    // Same instant, different calendar day in Tokyo (UTC+9).
    expect(utc).not.toBe(tokyo);
  });

  it('falls back to sane defaults when the tenant has no locale configured', () => {
    setTenant('', '');
    expect(formatDate('2026-03-04T00:00:00Z')).toContain('2026');
  });

  // A malformed setting is a configuration error, not a reason to blank the page.
  it('degrades gracefully on an invalid locale or time zone', () => {
    setTenant('not-a-locale', 'Not/AZone');
    expect(formatDateTime('2026-03-04T00:00:00Z')).toBeTruthy();
  });

  it('returns empty string for missing or unparseable dates', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('nonsense')).toBe('');
  });

  it('formats numbers per locale', () => {
    setTenant('de-DE', 'UTC');
    expect(formatNumber(1234.5)).toBe('1.234,5');

    setTenant('en-US', 'UTC');
    expect(formatNumber(1234.5)).toBe('1,234.5');
  });

  // Currency comes from the plan, not the locale: a de-DE tenant may still be billed in USD.
  it('keeps the given currency regardless of locale', () => {
    setTenant('de-DE', 'UTC');
    const formatted = formatCurrency(49.99, 'USD');

    expect(formatted).toContain('49,99');
    expect(formatted.toUpperCase()).toContain('$');
  });
});
