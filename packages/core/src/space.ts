import fs from 'node:fs';
import path from 'node:path';

import { parse, stringify } from 'yaml';

import { AnimeSystemError } from './error';

const configFilename = `./anime.yaml`;

const DefaultStorageDirectory = `./anime`;

export interface AnimeSpace {
  readonly root: string;

  readonly storage: string;

  readonly preference: Preference;

  readonly plans: string[];

  readonly plugins: PluginEntry[];
}

export interface Preference {
  keywords: {
    order: Record<string, string[]>;
    exclude: string[];
  };
}

export interface PluginEntry {
  name: string;

  options: Record<string, any>;
}

export async function loadSpace(_root: string) {
  const root = path.resolve(_root);

  const configPath = path.join(root, configFilename);
  if (fs.existsSync(root) && fs.existsSync(configPath)) {
    // Load space directory
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = parse(configContent);

    const storageDirectory: string = config.storage ?? DefaultStorageDirectory;
    const plans = (config.plans ?? []).map((p: string) => path.join(root, p));
    const space: AnimeSpace = {
      root,
      storage: path.resolve(root, storageDirectory),
      preference: config.preference ?? {},
      plans,
      plugins: ((config.plugins ?? []) as any[]).map((p) => {
        if (typeof p === 'string') {
          return { name: p, options: {} };
        } else {
          const o = { ...p };
          const name = o.name;
          delete o.name;
          return { name, options: { ...o } };
        }
      })
    };

    // Validate space directory
    await validateSpace(space);
    return space;
  } else {
    // Create new space directory
    return makeNewSpace(root);
  }
}

async function validateSpace(space: AnimeSpace) {
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
  for (const p of space.plugins) {
    if (!p.name || !p.options || typeof p.options !== 'object') {
      throw new AnimeSystemError(`Plugin configuration may be incorrect`);
    }
  }
  for (const p of space.plans) {
    if (!fs.existsSync(p)) {
      throw new AnimeSystemError(`Plan ${p} config is not found`);
    }
  }
  return true;
}

async function makeNewSpace(root: string) {
  const space: AnimeSpace = {
    root,
    storage: path.join(root, DefaultStorageDirectory),
    preference: {
      keywords: {
        order: {
          format: ['mp4', 'mkv'],
          language: ['简', '繁'],
          resolution: ['1080', '720']
        },
        exclude: ['HEVC']
      }
    },
    plans: [],
    plugins: [
      { name: 'animegarden', options: {} },
      { name: 'download', options: { directory: './download' } }
    ]
  };

  await fs.promises.mkdir(space.root, { recursive: true }).catch(() => {});
  await fs.promises.mkdir(space.storage, { recursive: true }).catch(() => {});
  await fs.promises
    .mkdir(path.join(space.root, './plans'), { recursive: true })
    .catch(() => {});

  await fs.promises.writeFile(
    path.join(space.root, configFilename),
    stringify({
      ...space,
      root: undefined,
      storage: DefaultStorageDirectory,
      plugins: [
        { name: 'animegarden' } as PluginEntry,
        { name: 'download', directory: './download' } as unknown as PluginEntry
      ]
    }),
    'utf-8'
  );

  return space;
}
