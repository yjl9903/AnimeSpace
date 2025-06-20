import fs from 'fs-extra';
import path from 'pathe';

import { parse } from 'yaml';
import { fs as LocalFS } from 'breadfs/node';
import { AnyZodObject, z } from 'zod';

import type { Plugin } from '../plugin';

import { AnimeSystemError, debug } from '../error';

import type { AnimeSpace, LocalPath, PluginLoader } from './types';

import { makeBreadFS } from './storage';
import { makeNewSpace } from './new';
import { DefaultConfigFilename } from './constant';
import { PluginEntry, RawAnimeSpace, RawAnimeSpaceSchema } from './schema';

export async function loadSpace(_root: string, importPlugin?: PluginLoader): Promise<AnimeSpace> {
  const root = LocalFS.path(path.resolve(_root));

  const config = await loadRawSpace(root);
  const plugins = await loadPlugins(config.plugins);

  // Merge plugin schema
  const schema = plugins.reduce(
    (acc: AnyZodObject, plugin) => (plugin?.schema?.space ? acc.merge(plugin?.schema?.space) : acc),
    RawAnimeSpaceSchema
  );

  // Parse load config
  const parsed = schema.safeParse(config);
  if (parsed.success) {
    const space = parsed.data as RawAnimeSpace;
    const storage = makeBreadFS(root, space.storage);
    const resolved: AnimeSpace = {
      root,
      preference: space.preference,
      storage,
      plans: space.plans,
      plugins
    };

    // Init and validate space directory
    await initSpace(resolved);
    await validateSpace(resolved);

    return resolved;
  } else {
    debug(parsed.error.issues);
    throw new AnimeSystemError(`解析 ${root.join(DefaultConfigFilename).path} 失败`);
  }

  async function loadPlugins(entries: unknown) {
    if (importPlugin) {
      const parsed = z.array(PluginEntry).safeParse(entries);
      if (parsed.success) {
        const entries = parsed.data;
        return (await Promise.all(entries.map((p) => resolvePlugin(p)))).filter(
          Boolean
        ) as Plugin[];
      } else {
        throw new AnimeSystemError(`Failed to parse anime space plugin config`);
      }
    }
    return [];

    async function resolvePlugin(p: PluginEntry) {
      if (!!importPlugin) {
        if (typeof importPlugin === 'function') {
          return importPlugin(p);
        } else if (typeof importPlugin === 'object') {
          return importPlugin[p.name]?.(p);
        }
      }
      return undefined;
    }
  }
}

/**
 * Load space from root or create a new space directory
 */
async function loadRawSpace(root: LocalPath) {
  const { config } = await import('dotenv');
  await config({ path: [root.join('.env').toString()] });

  const configPath = root.join(DefaultConfigFilename);

  if (await configPath.exists()) {
    // Load space config file
    const configContent = await configPath.readText();

    return parse(configContent, {
      customTags: [
        {
          tag: '!env',
          resolve(value: string, onError: (message: string) => void) {
            const vars = Array.isArray(value) ? value : [value];
            const fallback = Array.isArray(value) && value.length > 1 ? vars.pop() : undefined;

            for (const name of vars) {
              const v = process.env[name];
              if (v !== undefined) {
                return parse(v);
              }
            }
            if (fallback !== undefined) return fallback;
            return null;
          },
          stringify(item) {
            return `!env ${item}`;
          },
          identify: () => false
        }
      ]
    });
  } else {
    // Create new empty space directory
    return await makeNewSpace(root.path);
  }
}

/**
 * Init space plugins
 */
export async function initSpace(space: AnimeSpace) {
  for (const plugin of space.plugins) {
    await plugin.prepare?.space?.(space);
  }
}

/**
 * Validate space
 */
export async function validateSpace(space: AnimeSpace) {
  const root = space.root.path;

  // Validate anime space directory
  const validateAnime = async () => {
    try {
      await fs.access(root, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      throw new AnimeSystemError(`Can not access anime space directory ${root}`);
    }

    // Validate anime storage directory
    if (space.storage.anime.fs === LocalFS) {
      try {
        await fs.access(space.storage.anime.path, fs.constants.R_OK | fs.constants.W_OK);
      } catch {
        try {
          await fs.mkdir(space.storage.anime.path, { recursive: true });
        } catch {
          throw new AnimeSystemError(
            `Can not access local anime storage directory ${space.storage.anime.path}`
          );
        }
      }
    }
  };

  // Create a symlink from the outside storage dir to the local dir
  // Example: Z:/path/to/animes/ -> $ANIMESPACE_ROOT/animes/
  // try {
  //   if (!isSubDir(root, space.storage)) {
  //     const dirname = path.basename(space.storage);
  //     const target = path.join(root, dirname);
  //     if (!(await fs.pathExists(target))) {
  //       // Target dir does not exist, create a new symblink
  //       await fs.symlink(space.storage, target);
  //     } else {
  //       // Target dir is a symlink, check whether it is the wanted dir
  //       const stat = await fs.lstat(target);
  //       if (stat.isSymbolicLink()) {
  //         const value = await fs.readlink(target);
  //         if (value !== space.storage) {
  //           // Recreate symlink when they are not matched
  //           await fs.remove(target);
  //           await fs.symlink(space.storage, target);
  //         }
  //       }
  //     }
  //   }
  // } catch {}

  // Validate library storage directory
  const validateLibrary = async () => {
    if (
      space.storage.library.fs === LocalFS &&
      space.storage.library.path !== space.storage.anime.path
    ) {
      try {
        await fs.access(space.storage.library.path, fs.constants.R_OK | fs.constants.W_OK);
      } catch {
        try {
          await fs.mkdir(space.storage.library.path, { recursive: true });
        } catch {
          throw new AnimeSystemError(
            `Can not access local anime external library directory ${space.storage.library.path}`
          );
        }
      }
    }
  };

  // Validate cache storage directory
  const validateCache = async () => {
    if (space.storage.cache.fs === LocalFS) {
      try {
        await fs.access(space.storage.cache.path, fs.constants.R_OK | fs.constants.W_OK);
      } catch {
        try {
          await fs.mkdir(space.storage.cache.path, { recursive: true });
        } catch {
          throw new AnimeSystemError(
            `Can not access local cache storage directory ${space.storage.cache.path}`
          );
        }
      }
    }
  };

  // Validate trash storage directory
  const validateTrash = async () => {
    if (space.storage.trash.fs === LocalFS) {
      try {
        await fs.access(space.storage.trash.path, fs.constants.R_OK | fs.constants.W_OK);
      } catch {
        try {
          await fs.mkdir(space.storage.trash.path, { recursive: true });
        } catch {
          throw new AnimeSystemError(
            `Can not access local trash storage directory ${space.storage.trash.path}`
          );
        }
      }
    }
  };

  await Promise.all([validateAnime(), validateLibrary(), validateCache(), validateTrash()]);

  return true;
}
