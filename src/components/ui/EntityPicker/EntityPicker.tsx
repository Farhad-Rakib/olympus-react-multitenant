import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface PickerOption<T> {
  value: T;
  label: string;
  hint?: string;
}

interface EntityPickerProps<T> {
  value: T | null;
  onChange: (value: T | null, option?: PickerOption<T>) => void;
  // Async search; called (debounced) with the typed text. Return the options to show.
  search: (query: string) => Promise<PickerOption<T>[]>;
  placeholder?: string;
  disabled?: boolean;
  // Label to show for the current value when the option list does not contain it (e.g. on edit).
  currentLabel?: string;
  id?: string;
}

// Generic async single-select used for product / variant / customer / shop / warehouse lookups.
// Keyboard: arrows to move, Enter to pick, Escape to close. Debounced 250 ms.
export function EntityPicker<T extends string | number>({ value, onChange, search, placeholder, disabled, currentLabel, id }: EntityPickerProps<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PickerOption<T>[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!open) return;
    const mine = ++seq.current;
    setLoading(true);
    const handle = setTimeout(() => {
      search(query).then((opts) => { if (mine === seq.current) { setOptions(opts); setActive(0); } }).catch(() => { if (mine === seq.current) setOptions([]); }).finally(() => { if (mine === seq.current) setLoading(false); });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open, search]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const display = selected?.label ?? currentLabel ?? (value != null ? String(value) : '');

  const pick = (o: PickerOption<T>) => { onChange(o.value, o); setOpen(false); setQuery(''); };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
        <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id ?? 'picker'}-listbox`}
          aria-autocomplete="list"
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 min-w-0"
          placeholder={placeholder}
          value={open ? query : display}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && open && options[active]) { e.preventDefault(); pick(options[active]); }
            else if (e.key === 'Escape') setOpen(false);
          }}
        />
        {value != null && !disabled && (
          <button type="button" aria-label="Clear" onClick={() => onChange(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        )}
      </div>
      {open && (
        <ul id={`${id ?? 'picker'}-listbox`} role="listbox" className="absolute z-40 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm">
          {loading && options.length === 0 && <li className="px-3 py-2 text-gray-500">…</li>}
          {!loading && options.length === 0 && <li className="px-3 py-2 text-gray-500">—</li>}
          {options.map((o, i) => (
            <li key={String(o.value)} role="option" aria-selected={o.value === value}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${o.value === value ? 'font-medium' : ''} text-gray-900 dark:text-white`}>
              {o.label}{o.hint && <span className="ml-2 text-xs text-gray-500">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
