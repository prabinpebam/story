import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Story E2E tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e/specs',

  // Use a unique output directory per run to avoid Windows/OneDrive EPERM
  // errors when Playwright tries to delete old per-test artifact folders.
  outputDir: process.env.PW_OUTPUT_DIR || `test-results/pw-${Date.now()}`,
  
  /* Run tests in files in parallel */
  fullyParallel: true,

  // Default to low parallelism for dev-server stability; override with PW_WORKERS.
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 2,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for app */
    // Use IPv4 explicitly to avoid occasional Windows localhost/IPv6 resolution issues.
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173',
    
    /* Collect trace on first retry */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Emulate dark color scheme for consistent test environment */
    colorScheme: 'dark',

    // Needed for clipboard-based paste tests (SVG markup paste).
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment to test on Firefox and WebKit
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Force a deterministic host/port; fail fast if the port is already in use.
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    // Avoid reusing a potentially stale dev server by default.
    reuseExistingServer: process.env.PW_REUSE_EXISTING_SERVER === 'true',
    timeout: 120 * 1000,
  },
});
