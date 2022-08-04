import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'src/cli',
    'src/index',
    'src/client',
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
