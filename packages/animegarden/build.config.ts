import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    inlineDependencies: true,
    emitCJS: true
  },
  dependencies: ['libaria2-ts'],
  externals: ['breadc']
});
