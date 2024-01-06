import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '@animespace/core': new URL('./packages/core/src/', import.meta.url).pathname,
      '@animespace/bangumi': new URL('./packages/bangumi/src/', import.meta.url).pathname,
      '@animespace/local': new URL('./packages/local/src/', import.meta.url).pathname,
      '@animespace/animegarden': new URL('./packages/animegarden/src/', import.meta.url).pathname
    }
  }
});
