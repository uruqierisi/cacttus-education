import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup.ts'],

    /**
     * A SHARED Postgres cannot be truncated concurrently: two workers resetting the
     * same tables would delete each other's fixtures mid-test. One fork, no file
     * parallelism, sequential suites.
     */
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    fileParallelism: false,
    sequence: { concurrent: false },

    testTimeout: 30_000,
    hookTimeout: 60_000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        // Process entry point: calls `start()` at import time and binds a port, so it
        // cannot be imported by a test. This is the ONLY source file excluded.
        'src/server.ts',
        // Ambient declarations — no executable code.
        'src/types/**',
      ],
    },
  },
});
