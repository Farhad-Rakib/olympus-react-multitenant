import { describe, it, expect, beforeEach, vi } from 'vitest';

// The store imports the API services and the query client; neither is exercised here.
vi.mock('../../../app/providers/AppProviders', () => ({
  queryClient: { clear: vi.fn(), prefetchQuery: vi.fn() },
}));

import { useAuthStore } from './auth.store';
import { queryClient } from '../../../app/providers/AppProviders';
import { AppConfig } from '../../../core/config/app.config';

const platformAdminPayload = { platform_admin: 'true', tenant_id: '1', permissions: [] as string[] };

describe('auth store: acting tenant (platform admin override)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(queryClient.clear).mockClear();
    useAuthStore.setState({ tokenPayload: platformAdminPayload, tenantSlug: 'home', actingTenantSlug: null });
  });

  it('reads the platform_admin claim the middleware checks', () => {
    expect(useAuthStore.getState().isPlatformAdmin()).toBe(true);

    useAuthStore.setState({ tokenPayload: { ...platformAdminPayload, platform_admin: undefined } });
    expect(useAuthStore.getState().isPlatformAdmin()).toBe(false);
  });

  it('switching tenants drops every cached query, since it all belonged to the previous tenant', () => {
    useAuthStore.getState().setActingTenant('acme');

    expect(useAuthStore.getState().actingTenantSlug).toBe('acme');
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });

  it('choosing your own tenant is the same as exiting the override', () => {
    useAuthStore.getState().setActingTenant('acme');
    useAuthStore.getState().setActingTenant('home');

    expect(useAuthStore.getState().actingTenantSlug).toBeNull();
  });

  it('re-selecting the current tenant is a no-op and does not clear the cache', () => {
    useAuthStore.getState().setActingTenant('acme');
    vi.mocked(queryClient.clear).mockClear();

    useAuthStore.getState().setActingTenant('acme');

    expect(queryClient.clear).not.toHaveBeenCalled();
  });

  // BaseRepository reads the slug from storage (not the store) to avoid an import cycle, so the
  // override must survive persistence or it would never reach the X-Tenant-Id header.
  it('persists the acting tenant so the request interceptor can read it', () => {
    useAuthStore.getState().setActingTenant('acme');

    const raw = localStorage.getItem(AppConfig.auth.tokenKey);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.actingTenantSlug).toBe('acme');
  });

  it('logout clears the override too', async () => {
    useAuthStore.getState().setActingTenant('acme');

    await useAuthStore.getState().logout().catch(() => {});

    expect(useAuthStore.getState().actingTenantSlug).toBeNull();
  });
});
