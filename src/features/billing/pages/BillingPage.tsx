import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreditCard, ExternalLink, Info, Package, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { toast } from '../../../components/ui/Toast/toast.store';
import { getApiErrorMessage } from '../../../core/utils/error';
import { formatCurrency } from '../../../core/i18n/format';
import {
  tenantBillingApi,
  BillingInterval,
  PurchasablePlanDto,
} from '../../../core/api/services/tenant-billing.api';

const intervalSuffix = (interval: BillingInterval, t: (k: string) => string) => {
  if (interval === BillingInterval.Monthly) return t('common.perMonth');
  if (interval === BillingInterval.Yearly) return t('common.perYear');
  return '';
};

const PlanCard: React.FC<{
  plan: PurchasablePlanDto;
  checkoutAvailable: boolean;
  isBusy: boolean;
  onChoose: (planKey: string) => void;
}> = ({ plan, checkoutAvailable, isBusy, onChoose }) => {
  const { t } = useTranslation();
  const sellable = plan.billingInterval !== BillingInterval.None && plan.price > 0;

  return (
    <div
      className={`flex flex-col rounded-xl border p-5 bg-white dark:bg-gray-800 ${
        plan.isCurrent
          ? 'border-blue-500 ring-1 ring-blue-500'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
        {plan.isCurrent && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {t('common.current')}
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
        {sellable ? (
          <>
            {formatCurrency(plan.price, plan.currency)}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{intervalSuffix(plan.billingInterval, t)}</span>
          </>
        ) : (
          <span className="text-base font-medium text-gray-500 dark:text-gray-400">{t(`billing.interval.${plan.billingInterval}`)}</span>
        )}
      </p>

      {plan.description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
      )}

      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
        <Users className="w-4 h-4" /> {t('billing.maxUsers', { count: plan.maxUsers })}
      </p>

      <div className="mt-auto pt-5">
        {!plan.isCurrent && (
          <button
            type="button"
            disabled={!checkoutAvailable || !sellable || isBusy}
            onClick={() => onChoose(plan.key)}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('billing.switchTo')}
          </button>
        )}
      </div>
    </div>
  );
};

export const BillingPage: React.FC = () => {
  const { t } = useTranslation();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ['tenant-billing', 'config'],
    queryFn: () => tenantBillingApi.getConfig(),
    staleTime: 10 * 60 * 1000,
  });

  const plansQuery = useQuery({
    queryKey: ['tenant-billing', 'plans'],
    queryFn: () => tenantBillingApi.getPlans(),
  });

  // Hosted pages are a full navigation, not a popup: the provider redirects back to
  // Payment:CheckoutSuccessUrl / CheckoutCancelUrl, and the licence itself is extended by the
  // webhook -- nothing on this page needs to wait for the result.
  const checkout = useMutation({
    mutationFn: (planKey: string) => tenantBillingApi.startCheckout(planKey),
    onMutate: (planKey) => setPendingPlan(planKey),
    onSuccess: ({ url }) => { window.location.assign(url); },
    onError: (error: unknown) => {
      setPendingPlan(null);
      toast.error(getApiErrorMessage(error, t('billing.checkoutFailed')));
    },
  });

  const portal = useMutation({
    mutationFn: () => tenantBillingApi.openPortal(),
    onSuccess: ({ url }) => { window.location.assign(url); },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, t('billing.portalFailed'))),
  });

  if (configQuery.isLoading || plansQuery.isLoading) return <Loader text={t('common.loading')} />;

  if (configQuery.isError || plansQuery.isError) {
    return (
      <ErrorState
        title={t('errors.generic')}
        message={t('errors.loadFailed')}
        retry={() => { configQuery.refetch(); plansQuery.refetch(); }}
      />
    );
  }

  const config = configQuery.data!;
  const plans = plansQuery.data ?? [];
  const current = plans.find((p) => p.isCurrent) ?? null;
  const isBusy = checkout.isPending || portal.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('billing.subtitle')}</p>
        </div>
        {config.checkoutAvailable && (
          <button
            type="button"
            onClick={() => portal.mutate()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            {portal.isPending ? t('billing.openingPortal') : t('billing.manageBilling')}
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('billing.currentPlan')}</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {current ? current.name : t('billing.noPlan')}
            {current && current.billingInterval !== BillingInterval.None && current.price > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                {formatCurrency(current.price, current.currency)}{intervalSuffix(current.billingInterval, t)}
              </span>
            )}
          </p>
        </div>
      </div>

      {!config.checkoutAvailable && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-900 dark:text-blue-200">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{t('billing.notAvailableTitle')}</p>
            <p className="mt-1">{t('billing.notAvailableBody')}</p>
            <p className="mt-1 text-xs opacity-75">{t('billing.provider', { provider: config.provider })}</p>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState icon={Package} title={t('billing.noPlansTitle')} description={t('billing.noPlansBody')} />
      ) : (
        <>
          {config.checkoutAvailable && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('billing.manageBillingHint')}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                checkoutAvailable={config.checkoutAvailable}
                isBusy={isBusy}
                onChoose={(key) => checkout.mutate(key)}
              />
            ))}
          </div>
          {pendingPlan && <p className="text-sm text-gray-500">{t('billing.redirecting')}</p>}
        </>
      )}
    </div>
  );
};
