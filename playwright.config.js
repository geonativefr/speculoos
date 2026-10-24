import { defineConfig, devices } from '@playwright/test';
import { API_PORT, APP_PORT } from './e2e/ports.js';

/*
 * End-to-end tests: a small Vue application built on the committed dist/, run in Chromium against a fake API Platform
 * and a fake Mercure hub (e2e/server). See RELEASING.md to run them.
 */
export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/.output/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
  webServer: [
    {
      command: 'node e2e/server/index.js',
      url: `http://127.0.0.1:${API_PORT}/_e2e/health`,
      reuseExistingServer: false,
    },
    {
      command: 'npx vite build --config e2e/app/vite.config.js && npx vite preview --config e2e/app/vite.config.js',
      url: `http://127.0.0.1:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
