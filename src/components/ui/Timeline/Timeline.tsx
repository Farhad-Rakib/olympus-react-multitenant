import { DateTime } from '../Format/Format';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  at: string | Date;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  actor?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const DOT: Record<NonNullable<TimelineItem['tone']>, string> = {
  neutral: 'bg-gray-400', info: 'bg-blue-500', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500',
};

// Vertical event list used by orders, customers, shipments, tickets… newest first is the caller's call.
export const Timeline: React.FC<{ items: TimelineItem[]; emptyText?: string }> = ({ items, emptyText = '—' }) => {
  if (items.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>;
  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="ml-5 mb-5 last:mb-0">
            <span className={`absolute -left-[7px] mt-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${DOT[item.tone ?? 'neutral']}`}>
              {Icon && <Icon className="h-2.5 w-2.5 text-white" />}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
              <DateTime value={item.at} className="text-xs text-gray-500 dark:text-gray-400" />
              {item.actor && <span className="text-xs text-gray-500 dark:text-gray-400">· {item.actor}</span>}
            </div>
            {item.description && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>}
          </li>
        );
      })}
    </ol>
  );
};
