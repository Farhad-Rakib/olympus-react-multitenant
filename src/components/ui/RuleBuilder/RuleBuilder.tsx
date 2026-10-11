import { Plus, Trash2, CornerDownRight } from 'lucide-react';
import { RuleNode, RuleField, RuleValue, RULE_OPS, RuleOp, isGroup, isNot, emptyLeaf, emptyGroup, coerce } from './rules';

interface RuleBuilderProps {
  value: RuleNode;
  onChange: (next: RuleNode) => void;
  fields: RuleField[];
  depth?: number;
}

const sel = 'px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600';
const inp = `${sel} min-w-[8rem]`;

// Visual editor for the shared condition tree used by segments, fraud rules, promotions and
// market restrictions. Emits exactly the JSON the server validates.
export const RuleBuilder: React.FC<RuleBuilderProps> = ({ value, onChange, fields, depth = 0 }) => {
  if (isNot(value)) {
    return (
      <div className="flex items-start gap-2">
        <span className="mt-2 text-xs font-semibold uppercase text-red-600">not</span>
        <div className="flex-1"><RuleBuilder value={value.not} onChange={(n) => onChange({ not: n })} fields={fields} depth={depth + 1} /></div>
        <button type="button" onClick={() => onChange(value.not)} className="mt-1.5 p-1 text-gray-400 hover:text-red-600" aria-label="Remove not"><Trash2 className="w-4 h-4" /></button>
      </div>
    );
  }

  if (isGroup(value)) {
    const kind: 'and' | 'or' = 'and' in value ? 'and' : 'or';
    const kids: RuleNode[] = 'and' in value ? value.and : value.or;
    const set = (next: RuleNode[]) => onChange(kind === 'and' ? { and: next } : { or: next });
    return (
      <div className={`rounded-lg border ${depth === 0 ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-600'} p-3 space-y-2`}>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Match</span>
          <select className={sel} value={kind} onChange={(e) => onChange(e.target.value === 'and' ? { and: kids } : { or: kids })} aria-label="Group kind">
            <option value="and">all (AND)</option>
            <option value="or">any (OR)</option>
          </select>
          <span className="text-gray-500">of:</span>
        </div>
        {kids.map((k, i) => (
          <div key={i} className="flex items-start gap-2">
            <CornerDownRight className="w-4 h-4 mt-2.5 text-gray-300 shrink-0" aria-hidden />
            <div className="flex-1"><RuleBuilder value={k} onChange={(n) => set(kids.map((x, j) => (j === i ? n : x)))} fields={fields} depth={depth + 1} /></div>
            {!isGroup(k) && !isNot(k) && (
              <button type="button" onClick={() => set(kids.filter((_, j) => j !== i))} className="mt-1.5 p-1 text-gray-400 hover:text-red-600" aria-label="Remove condition"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => set([...kids, emptyLeaf(fields[0]?.path)])} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"><Plus className="w-3.5 h-3.5" /> condition</button>
          <button type="button" onClick={() => set([...kids, emptyGroup(kind === 'and' ? 'or' : 'and')])} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"><Plus className="w-3.5 h-3.5" /> group</button>
          <button type="button" onClick={() => set([...kids, { not: emptyLeaf(fields[0]?.path) }])} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"><Plus className="w-3.5 h-3.5" /> not</button>
          {depth > 0 && kids.length === 0 && <span className="text-xs text-red-600">empty group</span>}
        </div>
      </div>
    );
  }

  const field = fields.find((f) => f.path === value.field);
  const op = RULE_OPS.find((o) => o.value === value.op) ?? RULE_OPS[0];
  const type = field?.type ?? 'text';
  const setLeaf = (patch: { field?: string; op?: RuleOp; value?: RuleValue }) => onChange({ ...value, ...patch } as RuleNode);
  const listValue = Array.isArray(value.value) ? value.value : [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={sel} value={value.field} onChange={(e) => setLeaf({ field: e.target.value })} aria-label="Field">
        <option value="">field…</option>
        {fields.map((f) => <option key={f.path} value={f.path}>{f.label}</option>)}
      </select>
      <select className={sel} value={value.op} onChange={(e) => {
        const next = RULE_OPS.find((o) => o.value === e.target.value)!;
        const v = next.arity === 0 ? undefined : next.arity === 2 ? ['', ''] : next.arity === 'list' ? [] : '';
        onChange({ field: value.field, op: next.value, value: v as RuleValue | undefined });
      }} aria-label="Operator">
        {RULE_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {op.arity === 1 && (field?.type === 'select' ? (
        <select className={sel} value={String(value.value ?? '')} onChange={(e) => setLeaf({ value: coerce(e.target.value, typeof field.options?.[0]?.value === 'number' ? 'number' : 'text') })} aria-label="Value">
          <option value="">value…</option>{field.options?.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
        </select>
      ) : field?.type === 'boolean' ? (
        <select className={sel} value={String(value.value ?? 'true')} onChange={(e) => setLeaf({ value: e.target.value === 'true' })} aria-label="Value"><option value="true">true</option><option value="false">false</option></select>
      ) : (
        <input className={inp} type={type === 'number' ? 'number' : type === 'date' ? 'datetime-local' : 'text'} value={String(value.value ?? '')} onChange={(e) => setLeaf({ value: coerce(e.target.value, type) })} aria-label="Value" />
      ))}
      {op.arity === 2 && (
        <>
          <input className={inp} type={type === 'number' ? 'number' : type === 'date' ? 'datetime-local' : 'text'} value={String(listValue[0] ?? '')} onChange={(e) => setLeaf({ value: [coerce(e.target.value, type), listValue[1] ?? ''] })} aria-label="From" />
          <span className="text-gray-500 text-sm">and</span>
          <input className={inp} type={type === 'number' ? 'number' : type === 'date' ? 'datetime-local' : 'text'} value={String(listValue[1] ?? '')} onChange={(e) => setLeaf({ value: [listValue[0] ?? '', coerce(e.target.value, type)] })} aria-label="To" />
        </>
      )}
      {op.arity === 'list' && (
        <input className={`${inp} min-w-[14rem]`} placeholder="comma-separated" value={listValue.map(String).join(', ')} onChange={(e) => setLeaf({ value: e.target.value.split(',').map((s) => s.trim()).filter(Boolean).map((s) => coerce(s, type)) })} aria-label="Values" />
      )}
    </div>
  );
};
