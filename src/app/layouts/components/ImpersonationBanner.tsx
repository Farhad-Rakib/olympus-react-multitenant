import { UserCog, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { formatDateTime } from '../../../core/i18n/format';

// Persistent and not dismissible: the support person must never forget whose session this is.
export const ImpersonationBanner: React.FC = () => {
  const { t } = useTranslation();
  const impersonation = useAuthStore((s) => s.impersonation);
  const endImpersonation = useAuthStore((s) => s.endImpersonation);

  if (!impersonation) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-2 border-b text-sm bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
    >
      <UserCog className="w-4 h-4 shrink-0" aria-hidden />
      <span className="flex-1">
        {t('impersonation.banner', { name: impersonation.fullName, email: impersonation.email })}
        <span className="ml-2 text-xs opacity-75">{t('impersonation.expires', { time: formatDateTime(impersonation.expiresAtUtc) })}</span>
      </span>
      <button
        type="button"
        onClick={() => { endImpersonation(); window.location.assign('/users'); }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-medium"
      >
        <X className="w-3.5 h-3.5" aria-hidden /> {t('impersonation.exit')}
      </button>
    </div>
  );
};
