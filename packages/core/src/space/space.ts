import fs from 'fs-extra';
import path from 'node:path';

import { createDefu } from 'defu';
import { parse, stringify } from 'yaml';

import type { Plugin } from '../plugin';

import { AnimeSystemError } from '../error';
import { formatStringArray, isSubDir } from '../utils';

import type { Plan, AnimeSpace, PluginEntry, RawAnimeSpace } from './types';

import { loadPlan } from './plan';

const defu = createDefu((obj, key, value) => {
  if (key === 'include' && Array.isArray(obj[key]) && Array.isArray(value)) {
    // @ts-ignore
    obj[key] = [...new Set([...value, ...obj[key]])];
    return true;
  }
});

const configFilename = `./anime.yaml`;

const DefaultStorageDirectory = `./animes`;

const DefaultAnimeFormat = '{title}';

const DefaultEpisodeFormat = '[{fansub}] {title} - E{ep}.{extension}';

const DefaultFilmFormat = '[{fansub}] {title}.{extension}';

export type PluginLoaderFn = (
  entry: PluginEntry
) => Plugin | undefined | Promise<Plugin | undefined>;

export type PluginLoader = Record<string, PluginLoaderFn> | PluginLoaderFn;

export async function loadSpace(
  _root: string,
  importPlugin?: PluginLoader
): Promise<AnimeSpace> {
  const root = path.resolve(_root);

  const configPath = path.join(root, configFilename);
  if ((await fs.exists(root)) && (await fs.exists(configPath))) {
    // Load space directory
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = parse(configContent);

    const storageDirectory: string = config.storage ?? DefaultStorageDirectory;
    const plans = formatStringArray(config.plans); // normalize to absolute path when loading

    const space: RawAnimeSpace = defu(
      {
        root,
        storage: path.resolve(root, storageDirectory),
        preference: config.preference,
        plans,
        plugins: config.plugins
      },
      {
        preference: {
          format: {
            anime: DefaultAnimeFormat,
            episode: DefaultEpisodeFormat
          },
          extension: {
            include: ['mp4'],
            exclude: []
          },
          keyword: {
            order: {},
            exclude: []
          },
          fansub: {
            order: [],
            exclude: []
          }
        },
        plans: [],
        plugins: []
      }
    );

    // Validate space directory
    await validateSpace(space);
    return load(space);
  } else {
    // Create new space directory
    const space = await makeNewSpace(root);
    return load(space);
  }

  async function load(space: RawAnimeSpace) {
    let plans: Plan[] | undefined = undefined;
    const resolved: AnimeSpace = {
      ...space,
      resolvePath(...d) {
        return path.resolve(resolved.root, ...d);
      },
      async plans() {
        if (plans !== undefined) {
          return plans;
        } else {
          plans = await loadPlan(space.root, space.plans);
          for (const plugin of resolved.plugins) {
            await plugin.preparePlans?.(resolved, plans);
          }
          return plans;
        }
      },
      plugins: importPlugin
        ? ((
            await Promise.all(space.plugins.map((p) => resolvePlugin(p)))
          ).filter(Boolean) as Plugin[])
        : []
    };
    for (const plugin of resolved.plugins) {
      await plugin.prepare?.(resolved);
    }
    return resolved;
  }

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

async function validateSpace(space: RawAnimeSpace) {
  try {
    await fs.access(space.root, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new AnimeSystemError(`Can not access AnimePaste space directory`);
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
    if (!isSubDir(space.root, space.storage)) {
      const dirname = path.basename(space.storage);
      const target = path.join(space.root, dirname);
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
    root,
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

  await fs.mkdir(space.root, { recursive: true }).catch(() => {});

  await Promise.all([
    fs.mkdir(space.storage, { recursive: true }).catch(() => {}),
    fs
      .mkdir(path.join(space.root, './plans'), { recursive: true })
      .catch(() => {}),
    fs
      .mkdir(path.join(space.root, './download'), { recursive: true })
      .catch(() => {}),
    fs
      .mkdir(path.join(space.root, './local'), { recursive: true })
      .catch(() => {}),
    fs.writeFile(
      path.join(space.root, configFilename),
      stringify({
        ...space,
        root: undefined,
        storage: DefaultStorageDirectory
      }),
      'utf-8'
    ),
    fs.writeFile(
      path.join(space.root, '.gitignore'),
      ['*.mp4', '*.mkv', '*.aria2'].join('\n'),
      'utf-8'
    ),
    fs.writeFile(path.join(space.root, 'README.md'), `# AnimeSpace\n`, 'utf-8')
  ]);

  return space;
}
