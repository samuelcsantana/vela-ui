import { configDefaults, coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ is Playwright's turf (npm run test:e2e), not Vitest's.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/routeTree.gen.ts',
        'src/index.tsx',
        'src/App.tsx',
        'src/router.tsx',
        'src/routes/**',
        'src/lib/i18n/locales/**',
        'src/test/**',
        'rsbuild.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'postcss.config.mjs',
        'e2e/**',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
