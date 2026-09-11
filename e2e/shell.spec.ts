import { test, expect } from '@playwright/test';
import { mockApi, login } from './api-mock';

test.describe('app shell', () => {
  test('signs in and lands on the dashboard', async ({ page }) => {
    await mockApi(page);
    await login(page);

    await expect(page.getByText(/your workspace at a glance/i)).toBeVisible();
    await expect(page.getByText(/^Pro · /)).toBeVisible();
  });

  test('unauthenticated visitors are sent to login', async ({ page }) => {
    await mockApi(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('expired licence shows a non-dismissible banner with a billing link for admins', async ({ page }) => {
    await mockApi(page, { licenseStatus: 3 });
    await login(page);

    await expect(page.getByText(/your license has expired/i)).toBeVisible();
    await page.getByRole('link', { name: /renew or change plan/i }).click();
    await expect(page).toHaveURL(/\/billing/);
    await expect(page.getByText(/self-service billing is not enabled/i)).toBeVisible();
  });

  test('switching language applies DB translations and falls back to English', async ({ page }) => {
    await mockApi(page, { translations: { fr: { 'dashboard.title': 'Votre espace en un coup d’œil' } } });
    await login(page);

    await page.getByLabel(/^language$/i).selectOption('fr');
    await expect(page.getByText('Votre espace en un coup d’œil')).toBeVisible();
    // Untranslated key stays English rather than rendering its key.
    await expect(page.getByText('Plan', { exact: true })).toBeVisible();
    await expect(page.getByText('dashboard.plan')).toHaveCount(0);
  });

  test('platform admins get a tenant switcher; switching shows the acting banner', async ({ page }) => {
    await mockApi(page, { platformAdmin: true });
    await login(page);

    const switcher = page.getByLabel(/acting as tenant/i);
    await expect(switcher).toBeVisible();
    await switcher.selectOption('globex');
    await expect(page.getByText(/you are administering tenant globex/i)).toBeVisible();

    await page.getByRole('button', { name: /back to my tenant/i }).click();
    await expect(page.getByText(/you are administering tenant/i)).toHaveCount(0);
  });

  test('regular users never see the tenant switcher', async ({ page }) => {
    await mockApi(page);
    await login(page);
    await expect(page.getByLabel(/acting as tenant/i)).toHaveCount(0);
  });

  test('support user can view as another user and step back out', async ({ page }) => {
    await mockApi(page, { permissions: ['users.read', 'users.impersonate'] });
    await login(page);

    await page.goto('/users');
    await page.getByRole('button', { name: /view as/i }).first().click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('status')).toContainText(/viewing as bob builder/i);

    await page.getByRole('button', { name: /stop impersonating/i }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page).toHaveURL(/\/users/);
  });
});
