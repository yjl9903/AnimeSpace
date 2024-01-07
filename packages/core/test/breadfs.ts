import { Path } from 'breadfs';
import { expect } from 'vitest';
import { relative } from 'pathe';

expect.addSnapshotSerializer({
  test(val) {
    return val instanceof Path;
  },
  serialize(val: Path, config, indentation, depth, refs, printer) {
    return `Path { fs: "${val.fs.name}", path: "${relative('.', val.path)}" }`;
  }
});
