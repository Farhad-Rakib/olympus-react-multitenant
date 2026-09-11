export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'dark';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  dark: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900',
};

// One badge for every enum in the admin. Pass a `map` from your enum values to {label, tone} so the
// colour semantics stay consistent across modules (success = done/live, warning = needs attention…).
export const StatusBadge: React.FC<{ label: string; tone?: BadgeTone; className?: string }> = ({ label, tone = 'neutral', className }) => (
  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${TONES[tone]} ${className ?? ''}`}>{label}</span>
);
