import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config that runs tests against both Hono and Bun adapters.
 * This verifies the serve-static middleware is truly adapter-agnostic.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    // Test with Hono adapter
    {
      name: 'hono',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3007',
      },
    },
    // Test with Bun adapter
    {
      name: 'bun',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3008',
      },
    },
  ],
  webServer: [
    {
      command: 'bun run src/main-hono.ts',
      url: 'http://localhost:3007',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
    {
      command: 'bun run src/main-bun.ts',
      url: 'http://localhost:3008',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  ],
});
