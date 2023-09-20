import fs from 'fs-extra';
import path from 'node:path';
import { Path } from 'breadfs';

import type { AnimeSpace } from '../space';

export function isSubDir(parent: string, dir: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function listIncludeFiles(space: AnimeSpace, directory: Path) {
  try {
    const exts = new Set(space.preference.extension.include);

    return (await directory.list())
      .filter(f => exts.has(f.extname.slice(1)))
      .map(f => ({
        filename: f.basename,
        path: f,
        metadata: {}
      }));
  } catch {
    return [];
  }
}
