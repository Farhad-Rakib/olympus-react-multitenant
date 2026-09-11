import { StatusBadge, BadgeTone } from './StatusBadge';

export function enumBadge<T extends string | number>(map: Record<T, { label: string; tone: BadgeTone }>): React.FC<{ value: T }> {
  return ({ value }) => {
    const entry = map[value] ?? { label: String(value), tone: 'neutral' as BadgeTone };
    return <StatusBadge label={entry.label} tone={entry.tone} />;
  };
}
