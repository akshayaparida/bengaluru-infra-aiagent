import { defineConfig } from 'vitest/config';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      // Use jsdom for unit tests (browser environment), node for integration
      environment: 'jsdom',
      sequence: {
        concurrent: false,
      },
      env: {
        // Pass all env vars to test environment
        ...env,
      },
      // Setup file for test matchers
      setupFiles: ['./tests/setup.ts'],
    },
  };
});
