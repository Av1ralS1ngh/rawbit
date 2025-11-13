import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3041',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'light',
    extraHTTPHeaders: process.env.CF_ACCESS_CLIENT_ID
      ? {
          'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
          'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '',
        }
      : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 3041',
    url: 'http://127.0.0.1:3041',
    reuseExistingServer: !process.env.CI,
    timeout: 2 * 60 * 1000,
  },
});
