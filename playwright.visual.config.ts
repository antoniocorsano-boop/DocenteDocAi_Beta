import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/visual-regression',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad'] },
    },
    // MD3-specific test projects with deterministic settings
    {
      name: 'md3-chromium',
      testMatch: 'md3-*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // MD3-specific settings for consistent visual testing
        colorScheme: 'light',
        reducedMotion: 'reduce',
        // Disable hardware acceleration for consistent rendering
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    {
      name: 'md3-mobile',
      testMatch: 'md3-*.spec.ts',
      use: {
        ...devices['Pixel 5'],
        colorScheme: 'light',
        reducedMotion: 'reduce',
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: process.env.PW_BASE_URL || 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },

  // MD3-specific configuration
  expect: {
    // Custom thresholds for MD3-aware visual comparisons
    toHaveScreenshot: {
      threshold: 0.01, // 1% default for MD3 tests (can be overridden per test)
      maxDiffPixels: 100, // Allow small pixel differences
    },
  },
});