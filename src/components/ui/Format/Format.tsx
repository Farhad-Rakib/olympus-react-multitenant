import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../../core/i18n/format';

// Small display primitives so every module renders money/quantities/dates the same way
// (tenant locale + time zone, currency from the data, never guessed).

export const Money: React.FC<{ amount: number | null | undefined; currency: string; className?: string }> = ({ amount, currency, className }) => (
  <span className={`tabular-nums ${className ?? ''}`}>{formatCurrency(amount, currency)}</span>
);

export const Quantity: React.FC<{ value: number | null | undefined; unit?: string | null; className?: string }> = ({ value, unit, className }) => (
  <span className={`tabular-nums ${className ?? ''}`}>{formatNumber(value)}{unit ? ` ${unit}` : ''}</span>
);

export const DateOnly: React.FC<{ value: string | Date | null | undefined; className?: string }> = ({ value, className }) => (
  <time dateTime={value ? new Date(value).toISOString() : undefined} className={className}>{formatDate(value)}</time>
);

export const DateTime: React.FC<{ value: string | Date | null | undefined; className?: string }> = ({ value, className }) => (
  <time dateTime={value ? new Date(value).toISOString() : undefined} className={className}>{formatDateTime(value)}</time>
);
