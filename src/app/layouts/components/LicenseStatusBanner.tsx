import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, CreditCard, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tenantSelfApi, LicenseStatus } from '../../../core/api/services/tenant-self.api';
import { useAuthStore } from '../../../features/auth/store/auth.store';

const BANNER_STYLES: Partial<Record<LicenseStatus, { container: string; icon: React.ReactNode; messageKey: string; dismissible: boolean }>> = {
  [LicenseStatus.Trial]: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    icon: <Info className="w-4 h-4 shrink-0" />,
    messageKey: 'license.banner.trial',
    dismissible: true,
  },
  [LicenseStatus.GracePeriod]: {
    container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    messageKey: 'license.banner.gracePeriod',
    dismissible: true,
  },
  [LicenseStatus.Expired]: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    messageKey: 'license.banner.expired',
    dismissible: false,
  },
  [LicenseStatus.Suspended]: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    messageKey: 'license.banner.suspended',
    dismissible: false,
  },
};

export const LicenseStatusBanner: React.FC = () => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const canManageBilling = useAuthStore((s) => s.hasPermission('billing.manage'));

  const { data } = useQuery({
    queryKey: ['tenant-self-license'],
    queryFn: () => tenantSelfApi.getLicenseStatus(),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });

  if (!data || data.status === LicenseStatus.Active) return null;

  const config = BANNER_STYLES[data.status];
  if (!config || (config.dismissible && dismissed)) return null;

  // The billing page is [SkipLicenseCheck] server-side, so this link works precisely when the
  // rest of the app is returning 402 -- which is when it matters.
  const showRenew = canManageBilling && data.status !== LicenseStatus.Trial;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b text-sm ${config.container}`}>
      {config.icon}
      <span className="flex-1">{t(config.messageKey)}</span>
      {showRenew && (
        <Link
          to="/billing"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 font-medium transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" /> {t('license.banner.renew')}
        </Link>
      )}
      {config.dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label={t('common.dismiss')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
