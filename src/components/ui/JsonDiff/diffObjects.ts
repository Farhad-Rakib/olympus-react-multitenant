// Flat before/after diff for version history and amendment previews. Nested objects are
// flattened to dotted paths so a change deep in a snapshot still shows as one row.
type Flat = Record<string, string>;

const flatten = (value: unknown, prefix = '', out: Flat = {}): Flat => {
  if (value === null || value === undefined) { out[prefix || '$'] = ''; return out; }
  if (Array.isArray(value)) { value.forEach((v, i) => flatten(v, prefix ? `${prefix}[${i}]` : `[${i}]`, out)); if (value.length === 0) out[prefix] = '[]'; return out; }
  if (typeof value === 'object') { for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${k}` : k, out); return out; }
  out[prefix || '$'] = String(value);
  return out;
};

export const diffObjects = (before: unknown, after: unknown): { path: string; before?: string; after?: string }[] => {
  const a = flatten(before); const b = flatten(after);
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  return keys.filter((k) => a[k] !== b[k]).map((k) => ({ path: k, before: a[k], after: b[k] }));
};
