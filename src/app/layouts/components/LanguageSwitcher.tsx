import { useQuery } from '@tanstack/react-query';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translationApi } from '../../../core/api/services/translation.api';
import { useLanguageStore } from '../../../core/stores/language.store';
import { DEFAULT_LANGUAGE } from '../../../core/i18n';

// Shows English plus every language the tenant has translations for. The choice is the viewer's
// own (persisted per browser) and overrides the tenant locale until they pick "tenant default".
export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const chosen = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const { data: languages = [] } = useQuery({
    queryKey: ['translations', 'languages'],
    queryFn: () => translationApi.getLanguages(),
    staleTime: 10 * 60 * 1000,
  });

  const options = Array.from(new Set([DEFAULT_LANGUAGE, ...languages, ...(chosen ? [chosen] : [])]));

  const label = (code: string) => {
    try {
      return new Intl.DisplayNames([i18n.language], { type: 'language' }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <label className="flex items-center gap-1.5" title={t('language.label')}>
      <Languages className="w-4 h-4 text-gray-400" aria-hidden />
      <select
        aria-label={t('language.label')}
        value={chosen ?? ''}
        onChange={(e) => void setLanguage(e.target.value || null)}
        className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{t('language.tenantDefault')}</option>
        {options.map((code) => (
          <option key={code} value={code}>{label(code)} ({code})</option>
        ))}
      </select>
    </label>
  );
};
