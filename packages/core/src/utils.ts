import fs from 'fs-extra';
import path from 'node:path';

import type { AnimeSpace } from './space';

export function formatStringArray(arr: string | string[] | undefined | null) {
  if (arr !== undefined && arr !== null) {
    if (Array.isArray(arr)) {
      return arr;
    } else {
      return [arr];
    }
  }
  return [];
}

export async function listIncludeFiles(space: AnimeSpace, directory: string) {
  const exts = new Set(space.preference.extension.include);
  return (await fs.readdir(space.resolvePath(directory)))
    .filter((f) => exts.has(path.extname(f)))
    .map((f) => ({
      filename: f,
      path: path.join(directory, f),
      metadata: {}
    }));
}
