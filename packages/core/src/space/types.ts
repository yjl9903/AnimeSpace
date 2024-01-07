import type { Path } from 'breadfs';
import type { NodeFS } from 'breadfs/node';
import type { WebDAVProvider } from 'breadfs/webdav';

import type { Plugin } from '../plugin';
import type { Prettify } from '../utils';

import type { PluginEntry, Preference } from './schema';

export type LocalPath = Path<typeof NodeFS>;

export type StoragePath = Path<typeof NodeFS | WebDAVProvider>;

export interface AnimeSpace {
  /**
   * Anime space root directory
   */
  readonly root: LocalPath;

  /**
   * Storages
   *
   * Now support local file system and WebDAV server
   */
  readonly storage: Prettify<
    {
      readonly anime: StoragePath;

      readonly library: StoragePath;

      readonly cache: StoragePath;

      readonly trash: StoragePath;
    } & Record<string, StoragePath>
  >;

  /**
   * Preferences
   */
  readonly preference: Preference;

  /**
   * Plan config file patterns
   */
  readonly plans: string[];

  /**
   * Loaded plugins
   */
  readonly plugins: Plugin[];
}

export type PluginLoaderFn = (
  entry: PluginEntry
) => Plugin | undefined | Promise<Plugin | undefined>;

export type PluginLoader = Record<string, PluginLoaderFn> | PluginLoaderFn;
