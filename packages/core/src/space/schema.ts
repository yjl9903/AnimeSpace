import { z } from 'zod';

import { StringArray } from '../utils';

import {
  DefaultFilmFormat,
  DefaultEpisodeFormat,
  DefaultCacheDirectory,
  DefaultStorageDirectory,
  DefaultTrashDirectory
} from './constant';

export const PluginEntry = z.object({ name: z.string() }).passthrough();

export interface PluginEntry {
  name: string;

  [prop: string]: any;
}

export const FormatPreference = z.object({
  episode: z.string().default(DefaultEpisodeFormat),
  film: z.string().default(DefaultFilmFormat),
  ova: z.string().default(DefaultFilmFormat)
});

export const ExtensionPreference = z.object({
  include: z.array(z.string()).default(['mp4', 'mkv']),
  exclude: z.array(z.string()).default([])
});

export const KeywordPreference = z.object({
  order: z.record(z.string(), z.array(z.string())).default({}),
  exclude: z.array(z.string()).default([])
});

export const Preference = z
  .object({
    format: FormatPreference.default({}),
    extension: ExtensionPreference.default({}),
    keyword: KeywordPreference.default({})
  })
  .passthrough()
  .default({});

export type Preference = z.infer<typeof Preference>;

const StorageDef = z
  .object({
    provider: z.enum(['local', 'webdav']),
    directory: z.string(),
    url: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional()
  })
  .transform((storage) => {
    if (storage.provider === 'local') {
      return {
        provider: 'local' as const,
        directory: storage.directory
      };
    } else if (storage.provider === 'webdav') {
      if (storage.url) {
        return {
          provider: 'webdav' as const,
          url: storage.url,
          directory: storage.directory ?? '/',
          username: storage.username,
          password: storage.password
        };
      }
    }
    return z.NEVER;
  });
const StorageStr = z.string().transform((directory) => ({ provider: 'local' as const, directory }));
const StorageRef = z
  .object({ refer: z.string() })
  .transform((refer) => ({ provider: 'refer' as const, refer: refer.refer }));

export const Storage = z
  .record(z.union([StorageDef, StorageStr, StorageRef]))
  .default({})
  .transform((storage) => {
    if (!('anime' in storage)) {
      storage['anime'] = { provider: 'local', directory: DefaultStorageDirectory };
    }
    if (!('library' in storage)) {
      storage['library'] = { provider: 'refer', refer: 'anime' };
    }
    if (!('cache' in storage)) {
      storage['cache'] = { provider: 'local', directory: DefaultCacheDirectory };
    }
    if (!('trash' in storage)) {
      storage['trash'] = { provider: 'local', directory: DefaultTrashDirectory };
    }
    return storage;
  });

export const RawAnimeSpaceSchema = z.object({
  storage: Storage,
  preference: Preference,
  plans: StringArray,
  plugins: z.array(PluginEntry).default([])
});

export type RawAnimeSpace = z.infer<typeof RawAnimeSpaceSchema>;
