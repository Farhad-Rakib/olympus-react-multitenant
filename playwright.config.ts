import { defineConfig, devices } from '@playwright/test';

// Runs against the Vite dev server with every API call mocked at the network layer (see
// e2e/api-mock.ts) -- no backend, no database, deterministic in CI. It proves the app's own
// wiring: routing, auth state, guards, i18n loading, banners. Contract correctness against the
// real API is the backend suite's job.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_BASE_URL: 'http://localhost:4173/api/v1' },
  },
});
