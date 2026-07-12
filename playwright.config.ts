import { defineConfig, devices } from '@playwright/test';

// These tests run fully self-contained: every vela-core endpoint the app
// calls is mocked per-test via page.route(), so no backend or database is
// needed - which is what lets the e2e job run in CI on every push.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Pinned so i18next's browser-language detection is deterministic: the
    // assertions below use the English copy, regardless of the locale of the
    // machine running the suite.
    locale: 'en-US',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx rsbuild dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // CI has no .env file; the exact value doesn't matter since every
    // request to it is intercepted, but it must be an absolute URL so the
    // intercept glob in e2e/helpers.ts matches.
    env: { VITE_API_URL: 'http://localhost:3333/api' },
  },
});
