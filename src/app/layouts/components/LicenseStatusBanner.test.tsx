import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../core/i18n';
import { LicenseStatusBanner } from './LicenseStatusBanner';
import { tenantSelfApi, LicenseStatus } from '../../../core/api/services/tenant-self.api';
import { useAuthStore } from '../../../features/auth/store/auth.store';

vi.mock('../../../app/providers/AppProviders', () => ({
  queryClient: { clear: vi.fn(), prefetchQuery: vi.fn() },
}));

const renderBanner = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <LicenseStatusBanner />
      </MemoryRouter>
    </QueryClientProvider>
  );

const withStatus = (status: LicenseStatus) =>
  vi.spyOn(tenantSelfApi, 'getLicenseStatus').mockResolvedValue({ status });

const withPermissions = (permissions: string[]) =>
  useAuthStore.setState({ tokenPayload: { permissions } });

describe('LicenseStatusBanner', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders nothing for an active licence', async () => {
    withStatus(LicenseStatus.Active);
    withPermissions(['billing.manage']);
    const { container } = renderBanner();

    // Give the query a tick to resolve; the banner must still be empty afterwards.
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('offers the billing page to an admin whose licence has expired', async () => {
    withStatus(LicenseStatus.Expired);
    withPermissions(['billing.manage']);
    renderBanner();

    const link = await screen.findByRole('link', { name: /renew or change plan/i });
    expect(link).toHaveAttribute('href', '/billing');
  });

  it('does not offer billing to a member without billing.manage', async () => {
    withStatus(LicenseStatus.Expired);
    withPermissions([]);
    renderBanner();

    await screen.findByText(/your license has expired/i);
    expect(screen.queryByRole('link')).toBeNull();
  });

  // A trial is not something you renew; pushing checkout there would be noise.
  it('does not offer billing during a trial', async () => {
    withStatus(LicenseStatus.Trial);
    withPermissions(['billing.manage']);
    renderBanner();

    await screen.findByText(/trial license/i);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
