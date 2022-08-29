import * as fs from 'node:fs';
import { defineBuildConfig } from 'unbuild';

try {
  fs.mkdirSync('data');
} catch {}

export default defineBuildConfig({
  entries: [
    'src/cli',
    'src/index',
    'src/recent',
    'src/bgm',
    'src/transform',
    'src/utils',
    'src/vite'
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true
  }
});
