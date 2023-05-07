import fs from 'fs-extra';
import path from 'node:path';

import type { AnimeSpace } from '../space';

export function isSubDir(parent: string, dir: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function listIncludeFiles(space: AnimeSpace, directory: string) {
  try {
    const exts = new Set(space.preference.extension.include);
    return (await fs.readdir(space.resolvePath(directory)))
      .filter((f) => exts.has(path.extname(f).slice(1)))
      .map((f) => ({
        filename: f,
        path: space.resolvePath(directory, f),
        metadata: {}
      }));
  } catch {
    return [];
  }
}
