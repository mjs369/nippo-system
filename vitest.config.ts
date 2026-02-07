import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, './vitest.setup.ts')],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    env: {
      DATABASE_URL: 'mysql://test:test@localhost:3306/test_db',
      JWT_SECRET: 'test-secret-key-for-testing',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/coverage/**',
        '**/dist/**',
        '**/*.config.{ts,js}',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
