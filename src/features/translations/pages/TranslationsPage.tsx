import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Loader } from '../../../components/ui/Loader/Loader';
import { toast } from '../../../components/ui/Toast/toast.store';
import { getApiErrorMessage } from '../../../core/utils/error';
import { translationApi } from '../../../core/api/services/translation.api';
import { defaultEnglish, reloadActiveLanguage, normalizeLanguage, DEFAULT_LANGUAGE } from '../../../core/i18n';

const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

// One row per English key (plus any DB key the bundle no longer has). Edits live in `draft`
// until Save sends the whole language as one upsert; a blank value clears the override so the
// key falls back to English -- the server deletes the row rather than storing "".
export const TranslationsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const english = useMemo(defaultEnglish, []);

  const [language, setLanguage] = useState<string>('');
  const [newLanguage, setNewLanguage] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const languagesQuery = useQuery({
    queryKey: ['translations', 'languages'],
    queryFn: () => translationApi.getLanguages(),
  });

  const bundleQuery = useQuery({
    queryKey: ['translations', 'bundle', language],
    queryFn: () => translationApi.getBundle(language),
    enabled: !!language,
  });

  // First language becomes the selection once the list arrives; the editor stays empty otherwise.
  useEffect(() => {
    if (!language && languagesQuery.data?.length) setLanguage(languagesQuery.data[0]);
  }, [language, languagesQuery.data]);

  useEffect(() => {
    if (bundleQuery.data) setDraft({ ...bundleQuery.data.entries });
  }, [bundleQuery.data]);

  const saved = bundleQuery.data?.entries ?? {};
  const keys = useMemo(
    () => Array.from(new Set([...Object.keys(english), ...Object.keys(saved)])).sort(),
    [english, saved]
  );

  const dirty = useMemo(
    () => keys.some((k) => (draft[k] ?? '') !== (saved[k] ?? '')),
    [keys, draft, saved]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return keys.filter((k) => {
      if (onlyMissing && (draft[k] ?? '').trim()) return false;
      if (!q) return true;
      return k.toLowerCase().includes(q) || (english[k] ?? '').toLowerCase().includes(q) || (draft[k] ?? '').toLowerCase().includes(q);
    });
  }, [keys, search, onlyMissing, draft, english]);

  const translatedCount = keys.filter((k) => (draft[k] ?? '').trim()).length;

  const saveMutation = useMutation({
    mutationFn: () =>
      translationApi.upsert(
        language,
        keys
          .filter((k) => (draft[k] ?? '') !== (saved[k] ?? ''))
          .map((k) => ({ key: k, value: draft[k] ?? '' }))
      ),
    onSuccess: async (result) => {
      toast.success(t('translations.saved', { ...result }));
      await queryClient.invalidateQueries({ queryKey: ['translations'] });
      // If the admin is editing the language they are viewing in, show the new strings now.
      void reloadActiveLanguage();
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('translations.saveFailed'))),
  });

  const deleteMutation = useMutation({
    mutationFn: () => translationApi.deleteLanguage(language),
    onSuccess: async () => {
      setConfirmDelete(false);
      setLanguage('');
      setDraft({});
      await queryClient.invalidateQueries({ queryKey: ['translations'] });
      void reloadActiveLanguage();
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('errors.generic'))),
  });

  const addLanguage = () => {
    const tag = normalizeLanguage(newLanguage);
    if (!LANGUAGE_TAG.test(tag) || tag === DEFAULT_LANGUAGE) return;
    // Nothing is persisted until the first save; an empty language is just an empty editor.
    queryClient.setQueryData<string[]>(['translations', 'languages'], (prev = []) =>
      prev.includes(tag) ? prev : [...prev, tag].sort()
    );
    setLanguage(tag);
    setDraft({});
    setNewLanguage('');
  };

  const languages = languagesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('translations.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('translations.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="space-y-1 md:w-56">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('translations.language')}</label>
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setDraft({}); }}
            className={inputClasses}
            disabled={languages.length === 0}
          >
            {languages.length === 0 && <option value="">—</option>}
            {languages.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </div>
        <form
          className="flex items-end gap-2 md:flex-1"
          onSubmit={(e) => { e.preventDefault(); addLanguage(); }}
        >
          <div className="space-y-1 flex-1 md:max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('translations.newLanguage')}</label>
            <input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder={t('translations.newLanguagePlaceholder')}
              className={inputClasses}
            />
          </div>
          <button
            type="submit"
            disabled={!LANGUAGE_TAG.test(normalizeLanguage(newLanguage)) || normalizeLanguage(newLanguage) === DEFAULT_LANGUAGE}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {t('translations.add')}
          </button>
        </form>
        {language && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> {t('translations.deleteLanguage')}
          </button>
        )}
      </div>

      {!language ? (
        <EmptyState title={t('translations.noLanguages')} />
      ) : bundleQuery.isLoading ? (
        <Loader text={t('common.loading')} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('translations.search')}
              className={`${inputClasses} sm:max-w-sm`}
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="w-4 h-4 rounded" />
              {t('translations.onlyMissing')}
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
              {t('translations.translated', { done: translatedCount, total: keys.length })}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2.5 w-[28%]">{t('translations.key')}</th>
                  <th className="px-4 py-2.5 w-[32%]">{t('translations.english')}</th>
                  <th className="px-4 py-2.5">{t('translations.translation')} ({language})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {visible.map((key) => {
                  const changed = (draft[key] ?? '') !== (saved[key] ?? '');
                  return (
                    <tr key={key} className={changed ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600 dark:text-gray-400 align-top break-all">{key}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 align-top">
                        {english[key] ?? <span className="italic text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          value={draft[key] ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                          placeholder={english[key] ?? ''}
                          className={inputClasses}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">{t('translations.customKeyHint')}</p>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 py-3 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur">
            {dirty && <span className="text-sm text-amber-700 dark:text-amber-400">{t('translations.unsaved')}</span>}
            <button
              type="button"
              disabled={!dirty || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {t('translations.save')}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('translations.deleteLanguage')}
        message={t('translations.deleteConfirm', { language })}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
};
