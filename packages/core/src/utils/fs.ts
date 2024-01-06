import path from 'pathe';

import type { AnimeSpace, StoragePath } from '../space';

export function isSubDir(parent: string, dir: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function listIncludeFiles(space: AnimeSpace, directory: StoragePath) {
  try {
    const exts = new Set(space.preference.extension.include);

    return (await directory.list())
      .filter((f) => exts.has(f.extname.slice(1)))
      .map((f) => ({
        filename: f.basename,
        path: f as StoragePath,
        metadata: {}
      }));
  } catch {
    return [];
  }
}
