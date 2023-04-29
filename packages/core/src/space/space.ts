import fs from 'node:fs';
import path from 'node:path';

import { createDefu } from 'defu';
import { parse, stringify } from 'yaml';

import type { Plugin } from '../plugin';

import { AnimeSystemError } from '../error';
import { formatStringArray } from '../utils';

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

const DefaultStorageDirectory = `./anime`;

const DefaultAnimeFormat = '{title} ({yyyy}-{mm})';

const DefaultEpisodeFormat = '[{fansub}] {title} - E{ep}.{extension}';

export async function loadSpace(
  _root: string,
  importPlugin?: (
    entry: PluginEntry
  ) => Plugin | undefined | Promise<Plugin | undefined>
): Promise<AnimeSpace> {
  const root = path.resolve(_root);

  const configPath = path.join(root, configFilename);
  if (fs.existsSync(root) && fs.existsSync(configPath)) {
    // Load space directory
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = parse(configContent);

    const storageDirectory: string = config.storage ?? DefaultStorageDirectory;
    const plans = formatStringArray(config.plans).map((p: string) =>
      path.join(root, p)
    );
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
    return {
      ...space,
      async plans() {
        if (plans !== undefined) {
          return plans;
        } else {
          return (plans = await loadPlan(space.plans));
        }
      },
      plugins: importPlugin
        ? ((
            await Promise.all(space.plugins.map((p) => importPlugin(p)))
          ).filter(Boolean) as Plugin[])
        : []
    };
  }
}

async function validateSpace(space: RawAnimeSpace) {
  try {
    fs.accessSync(space.root, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new AnimeSystemError(`Can not access AnimePaste space directory`);
  }
  try {
    fs.accessSync(space.storage, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    throw new AnimeSystemError(`Can not access local anime storage directory`);
  }
  return true;
}

async function makeNewSpace(root: string): Promise<RawAnimeSpace> {
  const space: RawAnimeSpace = {
    root,
    storage: path.join(root, DefaultStorageDirectory),
    preference: {
      format: {
        anime: DefaultAnimeFormat,
        episode: DefaultEpisodeFormat
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
      { name: 'animegarden' },
      { name: 'download', directory: './download' }
    ]
  };

  await fs.promises.mkdir(space.root, { recursive: true }).catch(() => {});

  await Promise.all([
    fs.promises.mkdir(space.storage, { recursive: true }).catch(() => {}),
    fs.promises
      .mkdir(path.join(space.root, './plans'), { recursive: true })
      .catch(() => {}),
    fs.promises.writeFile(
      path.join(space.root, configFilename),
      stringify({
        ...space,
        root: undefined,
        storage: DefaultStorageDirectory
      }),
      'utf-8'
    )
  ]);

  return space;
}
