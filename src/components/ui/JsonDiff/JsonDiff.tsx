import { diffObjects } from './diffObjects';

export const JsonDiff: React.FC<{ before: unknown; after: unknown; emptyText?: string }> = ({ before, after, emptyText = 'No changes' }) => {
  const rows = diffObjects(before, after);
  if (rows.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500">
          <tr><th className="px-3 py-2">Field</th><th className="px-3 py-2">Before</th><th className="px-3 py-2">After</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.map((r) => (
            <tr key={r.path}>
              <td className="px-3 py-1.5 font-mono text-xs text-gray-600 dark:text-gray-300">{r.path}</td>
              <td className="px-3 py-1.5 text-red-700 dark:text-red-400 line-through">{r.before ?? <span className="text-gray-400">—</span>}</td>
              <td className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400">{r.after ?? <span className="text-gray-400">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
