import fs from 'fs-extra';
import path from 'node:path';

import { BreadFS } from 'breadfs';
import { fs as LocalFS } from 'breadfs/node';
import { WebDAVProvider } from 'breadfs/webdav';
import { memoAsync } from 'memofunc';
import { AnyZodObject, z } from 'zod';
import { parse, stringify } from 'yaml';

import type { Plugin } from '../plugin';

import { AnimeSystemError, debug } from '../error';

import { loadPlan } from './plan';
import {
  AnimeSpace,
  PluginEntry,
  RawAnimeSpace,
  RawAnimeSpaceSchema
} from './schema';
import {
  DefaultAnimeFormat,
  DefaultCacheDirectory,
  DefaultConfigFilename,
  DefaultEpisodeFormat,
  DefaultFilmFormat,
  DefaultStorageDirectory
} from './constant';

export type PluginLoaderFn = (
  entry: PluginEntry
) => Plugin | undefined | Promise<Plugin | undefined>;

export type PluginLoader = Record<string, PluginLoaderFn> | PluginLoaderFn;

export async function loadSpace(
  _root: string,
  importPlugin?: PluginLoader
): Promise<AnimeSpace> {
  const root = path.resolve(_root);

  const config = await loadSpace();
  const plugins = await loadPlugins(config.plugins);

  // Merge plugin schema
  const schema = plugins.reduce(
    (acc: AnyZodObject, plugin) =>
      plugin?.schema?.space ? acc.merge(plugin?.schema?.space) : acc,
    RawAnimeSpaceSchema
  );

  // Parse load config
  const parsed = schema.safeParse(config);
  if (parsed.success) {
    const space = parsed.data as RawAnimeSpace;

    // Validate space directory
    await validateSpace(root, space);

    const plans = memoAsync(async () => {
      const plans = await loadPlan(root, space.plans, plugins);
      for (const plugin of resolved.plugins) {
        await plugin.prepare?.plans?.(resolved, plans);
      }
      return plans;
    });

    const storageFS = makeBreadFS(root, space.storage);
    const resolved: AnimeSpace = {
      root,
      ...space,
      storage: {
        anime: {
          ...space.storage.anime,
          ...storageFS.anime
        },
        library: {
          ...space.storage.library,
          ...storageFS.library
        },
        cache: {
          fs: LocalFS,
          directory: LocalFS.path(root).resolve(DefaultCacheDirectory)
        }
      },
      plans,
      plugins,
      resolvePath(...d) {
        return path.resolve(resolved.root, ...d);
      }
    };

    // Plugin init
    for (const plugin of resolved.plugins) {
      await plugin.prepare?.space?.(resolved);
    }

    return resolved;
  } else {
    debug(parsed.error.issues);
    throw new AnimeSystemError(
      `解析 ${path.join(root, DefaultConfigFilename)} 失败`
    );
  }

  async function loadPlugins(entries: unknown) {
    if (importPlugin) {
      const parsed = z.array(PluginEntry).safeParse(entries);
      if (parsed.success) {
        const entries = parsed.data;
        return (await Promise.all(entries.map(p => resolvePlugin(p)))).filter(
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

  /**
   * Load space from root or create a new space directory
   */
  async function loadSpace() {
    const configPath = path.join(root, DefaultConfigFilename);
    if ((await fs.exists(root)) && (await fs.exists(configPath))) {
      // Load space directory
      const configContent = await fs.readFile(configPath, 'utf-8');
      return parse(configContent);
    } else {
      // Create new space directory
      return await makeNewSpace(root);
    }
  }
}

async function validateSpace(root: string, space: RawAnimeSpace) {
  // Validate anime space directory
  try {
    await fs.access(root, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new AnimeSystemError(`Can not access anime space directory ${root}`);
  }

  // Validate anime storage directory
  if (space.storage.anime.provider === 'local') {
    try {
      await fs.access(
        space.storage.anime.directory,
        fs.constants.R_OK | fs.constants.W_OK
      );
    } catch {
      try {
        await fs.mkdir(space.storage.anime.directory, { recursive: true });
      } catch {
        throw new AnimeSystemError(
          `Can not access local anime storage directory ${space.storage}`
        );
      }
    }
  }

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

  if (space.storage.library.mode === 'external') {
    try {
      await fs.access(
        space.storage.library.directory,
        fs.constants.R_OK | fs.constants.W_OK
      );
    } catch {
      try {
        await fs.mkdir(space.storage.library.directory, { recursive: true });
      } catch {
        throw new AnimeSystemError(
          `Can not access local anime external library directory ${space.storage.library.directory}`
        );
      }
    }
  }

  return true;
}

async function makeNewSpace(root: string): Promise<RawAnimeSpace> {
  const space = {
    storage: {
      anime: {
        provider: 'local',
        directory: path.join(root, DefaultStorageDirectory)
      },
      library: { mode: 'embedded' }
    },
    preference: {
      format: {
        anime: DefaultAnimeFormat,
        episode: DefaultEpisodeFormat,
        film: DefaultFilmFormat,
        ova: DefaultFilmFormat
      },
      extension: {
        include: ['mp4', 'mkv'],
        exclude: []
      },
      keyword: {
        order: {
          format: ['mp4', 'mkv'],
          language: ['简', '繁'],
          resolution: ['1080', '720']
        },
        exclude: []
      },
      fansub: {
        order: [],
        exclude: []
      }
    },
    plans: ['./plans/*.yaml'],
    plugins: [
      { name: 'animegarden', provider: 'aria2', directory: './download' },
      { name: 'local', directory: './local' },
      { name: 'bangumi', username: '' }
    ]
  } satisfies RawAnimeSpace;

  await fs.mkdir(root, { recursive: true }).catch(() => {});

  await Promise.all([
    fs
      .mkdir(space.storage.anime.directory, { recursive: true })
      .catch(() => {}),
    fs.mkdir(path.join(root, './plans'), { recursive: true }).catch(() => {}),
    fs
      .mkdir(path.join(root, './download'), { recursive: true })
      .catch(() => {}),
    fs.mkdir(path.join(root, './local'), { recursive: true }).catch(() => {}),
    fs.writeFile(
      path.join(root, DefaultConfigFilename),
      stringify({
        ...space,
        root: undefined,
        storage: {
          ...space.storage,
          anime: {
            ...space.storage.anime,
            directory: DefaultStorageDirectory
          }
        }
      }),
      'utf-8'
    ),
    fs.writeFile(
      path.join(root, '.gitignore'),
      ['*.mp4', '*.mkv', '*.aria2'].join('\n'),
      'utf-8'
    ),
    fs.writeFile(path.join(root, 'README.md'), `# AnimeSpace\n`, 'utf-8')
  ]);

  return space;
}

function makeBreadFS(root: string, storage: RawAnimeSpace['storage']) {
  const anime = makeAnime();
  const library = makeLibrary();

  return {
    anime,
    library
  };

  function makeAnime() {
    if (storage.anime.provider === 'local') {
      const fs = LocalFS;
      return {
        fs,
        directory: LocalFS.path(root).resolve(storage.anime.directory)
      };
    } else if (storage.anime.provider === 'webdav') {
      const fs = BreadFS.of(
        new WebDAVProvider(storage.anime.url, {
          username: storage.anime.username,
          password: storage.anime.password
        })
      );

      return {
        fs,
        directory: fs.path(storage.anime.directory)
      };
    } else {
      throw new Error(`Unexpected anime storage provider`);
    }
  }

  function makeLibrary() {
    if (storage.library.mode === 'embedded') {
      return anime;
    } else if (storage.library.mode === 'external') {
      const fs = LocalFS;
      return {
        fs,
        directory: fs.path(root).resolve(storage.library.directory)
      };
    } else {
      throw new Error(`Unexpected library storage mode`);
    }
  }
}
