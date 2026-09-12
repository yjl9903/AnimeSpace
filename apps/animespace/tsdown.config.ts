import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  fixedExtension: true,
  dts: true,
  clean: true,
  deps: {
    alwaysBundle: ['@animespace/shared', 'simptrad', 'date-fns']
  }
});
