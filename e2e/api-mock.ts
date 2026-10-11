import type { Page, Route } from '@playwright/test';

// Same-origin API base so page.route can intercept everything without CORS in the way.
export const API = 'http://localhost:4173/api/v1';

const ok = (data: unknown) => ({ success: true, message: 'ok', data });

// An unsigned JWT the frontend can decode; the backend is never contacted so validity is moot.
export const fakeJwt = (claims: Record<string, unknown>) => {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64({ sub: '1', email: 'admin@acme.test', name: 'Ada Admin', tenant_id: '1', exp: 4102444800, ...claims })}.sig`;
};

export interface MockOptions {
  permissions?: string[];
  platformAdmin?: boolean;
  licenseStatus?: number; // LicenseStatus enum: 0 Active … 3 Expired
  translations?: Record<string, Record<string, string>>; // lang -> flat entries
}

// Registers handlers for every endpoint the shell touches. Anything unlisted returns an empty
// success so a background query never fails the test for the wrong reason.
export const mockApi = async (page: Page, opts: MockOptions = {}) => {
  const permissions = opts.permissions ?? ['users.read', 'billing.manage', 'translations.manage'];
  const token = fakeJwt({ permission: permissions, permissions, ...(opts.platformAdmin ? { platform_admin: 'true' } : {}) });
  const translations = opts.translations ?? {};

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route(`${API}/**`, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    const method = route.request().method();

    if (path === '/Auth/login-config') return json(route, ok({ requiresTenantSlug: false, branding: null }));
    if (path === '/Auth/login' && method === 'POST') {
      return json(route, ok({
        tokens: { accessToken: token, refreshToken: 'r', accessTokenExpiresAtUtc: '2100-01-01T00:00:00Z', refreshTokenExpiresAtUtc: '2100-01-01T00:00:00Z' },
        branding: { title: 'Acme', logoUrl: null, tagline: null, faviconUrl: null, brandColor: null, supportEmail: null },
      }));
    }
    if (path === '/Auth/logout') return json(route, ok(null));
    if (path.startsWith('/Users/me') || path.startsWith('/users/me')) return json(route, ok({ id: 1, fullName: 'Ada Admin', email: 'admin@acme.test', roles: ['Admin'], profileImageUrl: null }));
    if (path === '/Menu' || path === '/menu' || path.startsWith('/Menu/') || path.startsWith('/menu/')) {
      return json(route, ok([{ id: 1, title: 'Dashboard', url: '/dashboard', icon: 'dashboard', requiredPermission: null, parentMenuId: null, children: [] }]));
    }
    if (path.startsWith('/site-settings') || path.startsWith('/SiteSettings')) {
      return json(route, ok([{ id: 1, key: 'Site.Title', value: 'Acme', description: null }, { id: 2, key: 'UI.Locale', value: 'en-US', description: null }]));
    }
    if (path === '/tenant/overview') {
      return json(route, ok({ name: 'Acme', slug: 'acme', plan: { key: 'pro', name: 'Pro', description: '', maxUsers: 10, price: 49, currency: 'USD', billingInterval: 1 }, licenseStatus: opts.licenseStatus ?? 0, trialEndsAtUtc: null, licenseExpiresAtUtc: null, userCount: 3, modules: [] }));
    }
    if (path === '/tenant/license') return json(route, ok({ status: opts.licenseStatus ?? 0 }));
    if (path === '/tenant/billing/config') return json(route, ok({ provider: 'manual', checkoutAvailable: false, defaultCurrency: 'USD' }));
    if (path === '/tenant/billing/plans') return json(route, ok([{ key: 'pro', name: 'Pro', description: '', maxUsers: 10, price: 49, currency: 'USD', billingInterval: 1, isCurrent: true }]));
    if (path === '/translations/languages') return json(route, ok(Object.keys(translations)));
    const bundle = path.match(/^\/translations\/([^/]+)$/);
    if (bundle && method === 'GET') return json(route, ok({ language: bundle[1], entries: translations[bundle[1]] ?? {} }));
    if (path === '/tenants') return json(route, ok([{ id: 1, slug: 'acme', name: 'Acme', isActive: true }, { id: 2, slug: 'globex', name: 'Globex', isActive: true }]));
    if (path === '/Users' && method === 'GET') return json(route, ok([{ id: 1, fullName: 'Ada Admin', email: 'admin@acme.test', isActive: true, roles: ['Admin'] }, { id: 2, fullName: 'Bob Builder', email: 'bob@acme.test', isActive: true, roles: ['Member'] }]));
    if (path === '/Users/2/impersonate' && method === 'POST') {
      return json(route, ok({ accessToken: fakeJwt({ sub: '2', email: 'bob@acme.test', name: 'Bob Builder', permission: ['dashboard'], act_by: '1' }), accessTokenExpiresAtUtc: '2100-01-01T00:30:00Z', userId: 2, fullName: 'Bob Builder', email: 'bob@acme.test' }));
    }

    return json(route, ok([]));
  });
};

export const login = async (page: Page) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@acme.test');
  await page.getByLabel(/password/i).fill('secret123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard');
};
