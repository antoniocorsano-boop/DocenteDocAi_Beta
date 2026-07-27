import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const storybookPlugins = [] as unknown[];

try {
  // Optional dependency: Storybook Vitest addon is loaded when present.
   
  const { storybookTest } = require('@storybook/addon-vitest/vitest-plugin');
  storybookPlugins.push(storybookTest({
    configDir: path.join(dirname, '.storybook')
  }));
} catch (error) {
  console.warn('[vitest] Storybook Vitest addon not installed; skipping Storybook project');
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 15000,
    setupFiles: ['./vitest.setup.tsx'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', '__tests__/visual-regression/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/polyfills.ts',
        'src/build-polyfill.js',
        'src/vite-env.d.ts',
        // Design token files — pure config, not logic
        'src/theme/tokens.ts',
        'src/theme/muiTheme.ts',
        'src/theme/theme.tsx',
      ],
      // Baseline protection thresholds (current: ~34% stmts, ~25% branches, ~26% funcs, ~35% lines)
      // Gradually increase as test coverage improves (#23 roadmap)
      thresholds: {
        statements: 30,
        branches: 22,
        functions: 22,
        lines: 32,
      },
    },
    projects: storybookPlugins.length ? [{
      extends: true,
      plugins: storybookPlugins,
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }] : undefined
  }
});
