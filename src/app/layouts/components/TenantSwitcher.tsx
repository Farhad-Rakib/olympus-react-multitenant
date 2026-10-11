import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { tenantListApi } from '../../../core/api/services/tenant-list.api';

// Platform admins only. Picks the tenant every subsequent request is scoped to (sent as
// X-Tenant-Id, which the backend honours solely for the platform_admin claim and audits as an
// "Accessed" row per request). Regular users never see this: for them the header is a no-op
// server-side anyway.
export const TenantSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isPlatformAdmin = useAuthStore((s) => s.isPlatformAdmin());
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const setActingTenant = useAuthStore((s) => s.setActingTenant);

  // The list itself must NOT be scoped to the acting tenant, or switching away becomes impossible
  // once a tenant is selected. /tenants is a platform-global endpoint, so it isn't affected.
  const { data: tenants = [], isError } = useQuery({
    queryKey: ['tenant-switcher', 'tenants'],
    queryFn: () => tenantListApi.getAll(),
    enabled: isPlatformAdmin,
    staleTime: 5 * 60 * 1000,
  });

  if (!isPlatformAdmin) return null;

  const onChange = (slug: string) => {
    setActingTenant(slug || null);
    // Whatever page was open belongs to the previous tenant's data (and may not even be
    // permitted there); the dashboard is the one page every tenant has.
    navigate('/dashboard');
  };

  return (
    <label className="hidden sm:flex items-center gap-2 mr-2" title={t('tenantSwitcher.label')}>
      <Building2 className="w-4 h-4 text-gray-400" aria-hidden />
      <select
        aria-label={t('tenantSwitcher.label')}
        value={actingTenantSlug ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[14rem]"
      >
        <option value="">{t('tenantSwitcher.self')}{tenantSlug ? ` (${tenantSlug})` : ''}</option>
        {isError && <option disabled>{t('tenantSwitcher.loadFailed')}</option>}
        {tenants
          .filter((tenant) => tenant.isActive && tenant.slug !== tenantSlug)
          .map((tenant) => (
            <option key={tenant.id} value={tenant.slug}>
              {tenant.name} ({tenant.slug})
            </option>
          ))}
      </select>
    </label>
  );
};

// Impossible to miss on purpose: a platform admin editing users while forgetting which tenant
// they are in is the realistic failure mode, and every one of those requests is being audited.
export const ActingTenantBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const setActingTenant = useAuthStore((s) => s.setActingTenant);

  if (!actingTenantSlug) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b text-sm bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-200">
      <Building2 className="w-4 h-4 shrink-0" aria-hidden />
      <span className="flex-1">{t('tenantSwitcher.banner', { tenant: actingTenantSlug })}</span>
      <button
        type="button"
        onClick={() => { setActingTenant(null); navigate('/dashboard'); }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-medium"
      >
        <X className="w-3.5 h-3.5" /> {t('tenantSwitcher.exit')}
      </button>
    </div>
  );
};
