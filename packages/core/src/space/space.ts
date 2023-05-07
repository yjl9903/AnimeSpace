import fs from 'fs-extra';
import path from 'node:path';

import { z, AnyZodObject } from 'zod';
import { parse, stringify } from 'yaml';

import type { Plugin } from '../plugin';

import { isSubDir, useAsyncSingleton } from '../utils';
import { AnimeSystemError } from '../error';

import {
  Plan,
  AnimeSpace,
  PluginEntry,
  RawAnimeSpace,
  RawAnimeSpaceSchema
} from './schema';

import { loadPlan } from './plan';
import {
  DefaultAnimeFormat,
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
      plugin?.schema?.space ? acc.merge(plugin?.schema?.space!) : acc,
    RawAnimeSpaceSchema.extend({
      storage: z
        .string()
        .default(DefaultStorageDirectory)
        .transform((s) => path.resolve(root, s))
    })
  );
  const parsed = schema.safeParse(config);

  if (parsed.success) {
    const space = parsed.data as RawAnimeSpace;
    // Validate space directory
    await validateSpace(root, space);

    const plans = useAsyncSingleton(async () => {
      const plans = await loadPlan(root, space.plans);
      for (const plugin of resolved.plugins) {
        await plugin.prepare?.plans?.(resolved, plans);
      }
      return plans;
    });
    const resolved: AnimeSpace = {
      root,
      ...space,
      resolvePath(...d) {
        return path.resolve(resolved.root, ...d);
      },
      plans,
      plugins
    };
    // Plugin init
    for (const plugin of resolved.plugins) {
      await plugin.prepare?.space?.(resolved);
    }

    return resolved;
  } else {
    throw new AnimeSystemError(`Failed to parse anime space config`);
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
  try {
    await fs.access(root, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new AnimeSystemError(`Can not access anime space directory`);
  }

  try {
    await fs.access(space.storage, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    try {
      await fs.mkdir(space.storage, { recursive: true });
    } catch {
      throw new AnimeSystemError(
        `Can not access local anime storage directory`
      );
    }
  }

  // Create a symlin from the outside storage dir to the local dir
  // Make it easy to edit the storage dir
  try {
    if (!isSubDir(root, space.storage)) {
      const dirname = path.basename(space.storage);
      const target = path.join(root, dirname);
      if (
        !(await fs.pathExists(target)) ||
        (await fs.readdir(target)).length === 0
      ) {
        fs.symlink(space.storage, target);
      }
    }
  } catch {}

  return true;
}

async function makeNewSpace(root: string): Promise<RawAnimeSpace> {
  const space: RawAnimeSpace = {
    storage: path.join(root, DefaultStorageDirectory),
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
      { name: 'download', directory: './local' },
      { name: 'bangumi', username: '' }
    ]
  };

  await fs.mkdir(root, { recursive: true }).catch(() => {});

  await Promise.all([
    fs.mkdir(space.storage, { recursive: true }).catch(() => {}),
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
        storage: DefaultStorageDirectory
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
