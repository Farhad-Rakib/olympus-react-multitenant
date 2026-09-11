import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users, Package, CheckCircle2, XCircle, CalendarClock, AlertTriangle, Boxes,
} from 'lucide-react';
import { tenantOverviewApi } from '../../../core/api/services/tenant-overview.api';
import { LicenseStatus } from '../../../core/api/services/tenant-self.api';
import { BillingInterval } from '../../../core/api/services/tenant-billing.api';
import { Loader } from '../../../components/ui/Loader/Loader';
import { formatDate, formatCurrency } from '../../../core/i18n/format';

const LICENSE_LABEL: Record<LicenseStatus, string> = {
  [LicenseStatus.Active]: 'Active',
  [LicenseStatus.Trial]: 'Trial',
  [LicenseStatus.GracePeriod]: 'Grace period',
  [LicenseStatus.Expired]: 'Expired',
  [LicenseStatus.Suspended]: 'Suspended',
};

const LICENSE_TONE: Record<LicenseStatus, string> = {
  [LicenseStatus.Active]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  [LicenseStatus.Trial]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [LicenseStatus.GracePeriod]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  [LicenseStatus.Expired]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  [LicenseStatus.Suspended]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant-overview'],
    queryFn: () => tenantOverviewApi.getOverview(),
    retry: false,
  });

  if (isLoading) return <Loader text="Loading dashboard..." />;

  if (error || !data) {
    return (
      <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <p className="text-sm text-rose-700 dark:text-rose-300">
            We couldn&apos;t load your workspace overview. Please refresh, or contact your administrator if this continues.
          </p>
        </div>
      </div>
    );
  }

  const enabledModules = data.modules.filter(m => m.isEnabled);
  const expiryIso = data.licenseStatus === LicenseStatus.Trial ? data.trialEndsAtUtc : data.licenseExpiresAtUtc;
  const expiryDate = expiryIso ? formatDate(expiryIso) : null;
  const remainingDays = daysUntil(expiryIso);

  // Only surfaced when it is genuinely close, so it stays meaningful instead of becoming furniture.
  const showExpiryWarning = remainingDays !== null && remainingDays <= 14;

  const seatUsage = data.plan && data.plan.maxUsers > 0
    ? Math.min(100, Math.round((data.userCount / data.plan.maxUsers) * 100))
    : null;

  const stats = [
    {
      label: t('dashboard.plan'),
      value: data.plan
        ? data.plan.billingInterval !== BillingInterval.None && data.plan.price > 0
          ? `${data.plan.name} · ${formatCurrency(data.plan.price, data.plan.currency)}${data.plan.billingInterval === BillingInterval.Yearly ? '/yr' : '/mo'}`
          : data.plan.name
        : t('dashboard.noPlan'),
      icon: Package,
      tone: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('dashboard.users'),
      value: data.plan && data.plan.maxUsers > 0 ? `${data.userCount} / ${data.plan.maxUsers}` : `${data.userCount}`,
      icon: Users,
      tone: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: t('dashboard.activeModules'),
      value: `${enabledModules.length} / ${data.modules.length}`,
      icon: Boxes,
      tone: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      label: data.licenseStatus === LicenseStatus.Trial ? t('dashboard.trialEnds') : t('dashboard.renews'),
      value: expiryDate ?? t('dashboard.noExpiry'),
      icon: CalendarClock,
      tone: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.title')}
          </p>
        </div>
        <span className={`self-start px-3 py-1 rounded-full text-xs font-medium ${LICENSE_TONE[data.licenseStatus]}`}>
          {LICENSE_LABEL[data.licenseStatus]}
        </span>
      </div>

      {showExpiryWarning && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {remainingDays !== null && remainingDays >= 0
              ? `Your ${data.licenseStatus === LicenseStatus.Trial ? 'trial' : 'subscription'} ends in ${remainingDays} day${remainingDays === 1 ? '' : 's'}${expiryDate ? ` (${expiryDate})` : ''}.`
              : `Your ${data.licenseStatus === LicenseStatus.Trial ? 'trial' : 'subscription'} has expired${expiryDate ? ` (${expiryDate})` : ''}.`}
            {' '}Contact your administrator to renew.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
              <span className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.tone}`} />
              </span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white truncate" title={stat.value}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {seatUsage !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.seatUsage')}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{seatUsage}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full ${seatUsage >= 90 ? 'bg-rose-500' : seatUsage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${seatUsage}%` }}
            />
          </div>
          {seatUsage >= 90 && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
              {t('dashboard.seatWarning')}
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('dashboard.yourModules')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.plan
              ? t('dashboard.includedWith', { plan: data.plan.name })
              : 'Modules currently granted to your workspace'}
          </p>
        </div>

        {data.modules.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No modules are assigned to your workspace yet. Contact your administrator to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.modules.map((module) => (
              <li key={module.key} className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{module.name}</p>
                  {module.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{module.description}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    module.isEnabled
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {module.isEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {module.isEnabled ? 'Active' : 'Not active'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/users"
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          Manage users
        </Link>
        <Link
          to="/site-settings"
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          Workspace settings
        </Link>
      </div>
    </div>
  );
};
