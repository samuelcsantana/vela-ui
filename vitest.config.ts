import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
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
        'postcss.config.mjs',
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
