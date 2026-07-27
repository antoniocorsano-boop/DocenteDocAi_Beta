import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './e2e/setup-test-results.ts',
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 20000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  use: {
    headless: true,
    actionTimeout: 30000,
    navigationTimeout: 45000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:5173',
    // SPA-specific configurations
    ignoreHTTPSErrors: true,
    bypassCSP: true, // Per development server
    // Pre-accept privacy consent so blocking modal never appears in tests
    storageState: './e2e/storage-state.json',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    // Progetti stabili: tutti i test smoke
    {
      name: 'chromium-stable',
      use: {
        ...devices['Desktop Chrome'],
        // SPA optimizations
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
      testMatch: ['**/smoke.spec.ts', '**/spa-navigation-example.spec.ts', '**/copilot-panel.spec.ts'],
    },

    // Test fragili isolati
    {
      name: 'chromium-flaky',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
      testMatch: ['**/smoke.spec.ts', '**/spa-navigation-example.spec.ts'],
      retries: 2,
      workers: 1, // limitare parallelismo
    },

    // SPA-specific test project
    {
      name: 'spa-navigation',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // SPA-specific flags
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows'
          ]
        }
      },
      testMatch: ['**/spa-*.spec.ts', '**-spa-migration.spec.ts'],
      retries: 1,
      workers: 2,
    },

    // Mobile gesture tests — Roadmap #4
    // Simulates Pixel 5 (393×851, touch enabled)
    {
      name: 'mobile-gestures',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ]
        }
      },
      testMatch: ['**/gesture-mobile.spec.ts'],
      retries: 2,
      workers: 1,
    },
  ],

  outputDir: 'test-results',
  reporter: [
    ['dot'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
});
