import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    sequence: {
      concurrent: false, // run test files sequentially to avoid DB cross-talk
    },
  },
});