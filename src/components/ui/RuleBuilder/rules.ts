// Client mirror of the server's JSON condition tree (Application/Common/Rules/RuleCondition.cs).
export type RuleOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with' | 'between' | 'exists' | 'regex';
export const RULE_OPS: { value: RuleOp; label: string; arity: 0 | 1 | 2 | 'list' }[] = [
  { value: 'eq', label: '=', arity: 1 }, { value: 'ne', label: '≠', arity: 1 }, { value: 'gt', label: '>', arity: 1 }, { value: 'gte', label: '≥', arity: 1 },
  { value: 'lt', label: '<', arity: 1 }, { value: 'lte', label: '≤', arity: 1 }, { value: 'in', label: 'in', arity: 'list' }, { value: 'not_in', label: 'not in', arity: 'list' },
  { value: 'contains', label: 'contains', arity: 1 }, { value: 'starts_with', label: 'starts with', arity: 1 }, { value: 'ends_with', label: 'ends with', arity: 1 },
  { value: 'between', label: 'between', arity: 2 }, { value: 'exists', label: 'exists', arity: 0 }, { value: 'regex', label: 'matches regex', arity: 1 },
];

export type RuleValue = string | number | boolean | RuleValue[] | null;
export type RuleNode =
  | { and: RuleNode[] }
  | { or: RuleNode[] }
  | { not: RuleNode }
  | { field: string; op: RuleOp; value?: RuleValue };

export interface RuleField { path: string; label: string; type: 'text' | 'number' | 'boolean' | 'date' | 'select'; options?: { value: string | number; label: string }[] }

export const isGroup = (n: RuleNode): n is { and: RuleNode[] } | { or: RuleNode[] } => 'and' in n || 'or' in n;
export const isNot = (n: RuleNode): n is { not: RuleNode } => 'not' in n;
export const emptyLeaf = (field = ''): RuleNode => ({ field, op: 'eq', value: '' });
export const emptyGroup = (kind: 'and' | 'or' = 'and'): RuleNode => (kind === 'and' ? { and: [emptyLeaf()] } : { or: [emptyLeaf()] });

// Parse a value the user typed into the JSON type the server expects for the field.
export const coerce = (raw: string, type: RuleField['type']): RuleValue => {
  if (type === 'number') { const n = Number(raw); return Number.isFinite(n) ? n : raw; }
  if (type === 'boolean') return raw === 'true';
  return raw;
};

export const validate = (n: RuleNode, path = '$'): string[] => {
  if (isNot(n)) return validate(n.not, `${path}.not`);
  if (isGroup(n)) {
    const kids = 'and' in n ? n.and : n.or;
    if (kids.length === 0) return [`${path}: group is empty`];
    return kids.flatMap((k, i) => validate(k, `${path}.${'and' in n ? 'and' : 'or'}[${i}]`));
  }
  const errs: string[] = [];
  if (!n.field) errs.push(`${path}: field is required`);
  const op = RULE_OPS.find((o) => o.value === n.op);
  if (!op) errs.push(`${path}: unknown operator`);
  else if (op.arity === 1 && (n.value === undefined || n.value === '' || n.value === null)) errs.push(`${path}: value is required`);
  else if (op.arity === 2 && (!Array.isArray(n.value) || n.value.length !== 2)) errs.push(`${path}: between needs two values`);
  else if (op.arity === 'list' && (!Array.isArray(n.value) || n.value.length === 0)) errs.push(`${path}: list must not be empty`);
  return errs;
};
