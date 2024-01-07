import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: [new URL('./packages/core/test/breadfs', import.meta.url).pathname],
    alias: {
      '@animespace/core': new URL('./packages/core/src/', import.meta.url).pathname,
      '@animespace/bangumi': new URL('./packages/bangumi/src/', import.meta.url).pathname,
      '@animespace/local': new URL('./packages/local/src/', import.meta.url).pathname,
      '@animespace/animegarden': new URL('./packages/animegarden/src/', import.meta.url).pathname
    }
  }
});
