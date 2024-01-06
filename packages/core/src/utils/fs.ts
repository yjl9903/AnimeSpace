import path from 'pathe';

import type { AnimeSpace, StoragePath } from '../space';

export function isSubDir(parent: string, dir: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function listIncludeFiles(
  extension: AnimeSpace['preference']['extension'],
  directory: StoragePath
) {
  try {
    const exts = new Set(extension.include);

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
