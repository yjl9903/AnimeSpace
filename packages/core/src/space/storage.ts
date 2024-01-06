import { BreadFS } from 'breadfs';
import { fs as LocalFS } from 'breadfs/node';
import { WebDAVProvider } from 'breadfs/webdav';

import type { RawAnimeSpace } from './schema';
import type { AnimeSpace, LocalPath } from './types';

export function makeBreadFS(
  root: LocalPath,
  storage: RawAnimeSpace['storage']
): AnimeSpace['storage'] {
  const resolved = {} as AnimeSpace['storage'];

  for (const [name, store] of Object.entries(storage)) {
    if (store.provider !== 'refer') {
      resolved[name] = makeConcreteStorage(name, store);
    }
  }
  for (const [name, store] of Object.entries(storage)) {
    if (store.provider === 'refer') {
      if (resolved[store.refer]) {
        resolved[name] = resolved[store.refer];
      } else {
        throw new Error(`Can not find storage ${store.refer}`);
      }
    }
  }

  if (!resolved.anime) {
    throw new Error(`Can not find anime storage`);
  }
  if (!resolved.library) {
    throw new Error(`Can not find storage storage`);
  }
  if (!resolved.cache) {
    throw new Error(`Can not find cache storage`);
  }

  return resolved;

  function makeConcreteStorage(name: string, storage: RawAnimeSpace['storage'][string]) {
    if (storage.provider === 'local') {
      return LocalFS.path(root).resolve(storage.directory);
    } else if (storage.provider === 'webdav') {
      const fs = BreadFS.of(
        new WebDAVProvider(storage.url, {
          username: storage.username,
          password: storage.password
        })
      );

      return fs.path(storage.directory);
    } else {
      throw new Error(`Unexpected storage provider of ${name}`);
    }
  }
}
