import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/cli', 'src/index', 'src/client', 'src/transform', 'src/utils'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true
  }
});
