import { useSiteSettingsStore } from '../stores/site-settings.store';

// Formatting reads the TENANT's locale and time zone, not the viewer's browser.
//
// Before this, every date went through toLocaleString() with no arguments, so two colleagues in the
// same tenant saw different formats depending on their browser language, and every timestamp
// rendered in the viewer's own zone even though the API returns UTC. One page hardcoded 'en-US'
// outright.

const resolve = () => {
  const { locale, timeZone } = useSiteSettingsStore.getState();
  return {
    locale: locale || 'en-US',
    // An invalid IANA zone makes Intl throw, so an empty setting falls back rather than breaking
    // every date on the page.
    timeZone: timeZone || 'UTC',
  };
};

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    // A malformed locale or zone in site settings is a configuration error, not a reason to blank
    // out a table cell.
    return fallback;
  }
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const { locale, timeZone } = resolve();
  return safe(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(date),
    date.toISOString().slice(0, 10)
  );
};

export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const { locale, timeZone } = resolve();
  return safe(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date),
    date.toISOString()
  );
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '';
  const { locale } = resolve();
  return safe(() => new Intl.NumberFormat(locale).format(value), String(value));
};

// Currency comes from the plan, not the locale: a tenant formatting in de-DE may still be billed in
// USD, and guessing the currency from the locale would misstate a price.
export const formatCurrency = (value: number | null | undefined, currency: string): string => {
  if (value == null || Number.isNaN(value)) return '';
  const { locale } = resolve();
  return safe(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value),
    `${currency} ${value.toFixed(2)}`
  );
};
