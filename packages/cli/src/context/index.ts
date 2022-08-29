import * as fs from 'fs-extra';
import * as path from 'node:path';
import { homedir } from 'node:os';

import { load, dump } from 'js-yaml';

import { EpisodeStore, MagnetStore, VideoStore } from '@animepaste/database';

import type { VideoStorePlatform } from '../io';
import type { CliOption, RawPlan } from '../types';

import { filterDef } from '../utils';

export interface GlobalConfig {
  plan: string | string[];

  server: {
    baseURL: string;

    token: string;
  };

  store: {};
}

const DefaultGlobalConfig: GlobalConfig = {
  plan: ['./plans/test.yaml'],
  server: {
    baseURL: '',
    token: ''
  },
  store: {
    local: {
      anime: './anime',
      cache: './cache'
    },
    ali: {
      accessKeyId: '',
      accessKeySecret: '',
      regionId: ''
    }
  }
};

export class GlobalContex {
  static SpaceDirectory = '.animepaste';
  static ConfigFilename = 'config.yaml';
  static DatabaseFilename = 'anime.db';

  cliOption!: CliOption;
  isDaemon: boolean = false;

  readonly root: string;
  readonly config: string;
  readonly databaseFilepath: string;

  readonly videoStore: VideoStore<VideoStorePlatform>;
  readonly episodeStore: EpisodeStore;
  readonly magnetStore: MagnetStore;

  private _cacheRoot: string;
  private _localRoot: string;
  private configCache: any;

  constructor() {
    this.root =
      process.env.ANIMEPASTE_ROOT ??
      path.join(homedir(), GlobalContex.SpaceDirectory);
    this._cacheRoot = path.join(this.root, 'cache');
    this._localRoot = path.join(this.root, 'anime');
    this.config = path.join(this.root, GlobalContex.ConfigFilename);
    this.databaseFilepath = path.join(this.root, GlobalContex.DatabaseFilename);

    this.videoStore = new VideoStore({ url: this.databaseFilepath });
    this.magnetStore = new MagnetStore({ url: this.databaseFilepath });
    this.episodeStore = new EpisodeStore({ url: this.databaseFilepath });
  }

  get localRoot() {
    return this._localRoot;
  }

  get cacheRoot() {
    return this._cacheRoot;
  }

  async init(option: CliOption) {
    this.cliOption = option;

    await fs.ensureDir(this.root);
    await Promise.all([
      fs.ensureDir(path.join(this.root, 'anime')),
      fs.ensureDir(path.join(this.root, 'cache')),
      fs.ensureDir(path.join(this.root, 'plans'))
    ]);

    if (!(await fs.pathExists(this.config))) {
      await fs.writeFile(
        this.config,
        dump(DefaultGlobalConfig, { indent: 2 })
          .replace('server', '\nserver')
          .replace('store', '\nstore'),
        'utf-8'
      );
    }

    // Setup cache and anime root
    {
      type LocalConfig = { anime?: string; cache?: string };
      const local = await this.getStoreConfig<LocalConfig>('local');
      if (local?.anime) {
        this._localRoot = path.resolve(this.root, local.anime);
      }
      if (!fs.existsSync(this._localRoot)) {
        throw new Error(
          `Local stroage root "${this._localRoot}" does not exist`
        );
      }
      if (local?.cache) {
        this._cacheRoot = path.resolve(this.root, local.cache);
      }
      if (!fs.existsSync(this._cacheRoot)) {
        throw new Error(
          `Local stroage root "${this._cacheRoot}" does not exist`
        );
      }
    }

    await this.magnetStore.ensure();
    await this.loadConfig();
  }

  async makeLocalAnimeRoot(title: string) {
    const local = path.join(this.localRoot, title);
    await fs.ensureDir(local);
    return local;
  }

  async loadConfig<T = any>(): Promise<T> {
    const content = await fs.readFile(this.config, 'utf-8');
    this.configCache = load(content);
    return this.configCache;
  }

  async getPlans(): Promise<RawPlan[]> {
    const config = await this.loadConfig<GlobalConfig>();
    const planPath = filterDef([
      // @ts-ignore
      ...(Array.isArray(config.plans) ? config.plans : [config.plans]),
      ...(Array.isArray(config.plan) ? config.plan : [config.plan])
    ]);
    const planBody: RawPlan[] = [];
    for (const plan of planPath) {
      const planPath = path.join(this.root, plan);
      if (!fs.existsSync(planPath)) {
        throw new Error(`You should provide plan "${plan}"`);
      }
      planBody.push(load(fs.readFileSync(planPath, 'utf-8')) as RawPlan);
    }
    return planBody;
  }

  async getServerConfig(): Promise<GlobalConfig['server']> {
    const config = await this.loadConfig<GlobalConfig>();
    return config.server;
  }

  async getStoreConfig<T = any>(key: string): Promise<T> {
    return (await this.loadConfig()).store[key];
  }

  // -----------

  /**
   * Copy file from "src" to cache root
   *
   * @param src
   */
  async copyToCache(src: string) {
    if (contains(this.localRoot, src) || contains(this.cacheRoot, src)) {
      return src;
    }
    const filepath = path.join(this.cacheRoot, path.basename(src));
    await fs.copy(src, filepath);
    return filepath;
  }

  formatOnlineURL(baseURL: string, bgmId: string) {
    return `${baseURL}${baseURL.endsWith('/') ? '' : '/'}anime/${bgmId}`;
  }

  encodePath(src: string) {
    if (contains(this.localRoot, src)) {
      return 'local:' + normalizePath(path.relative(this.localRoot, src));
    } else {
      return 'cache:' + normalizePath(path.relative(this.cacheRoot, src));
    }
  }

  decodePath(src: string, filename?: string) {
    const filenames = filename ? [filename] : [];
    if (src.startsWith('local:')) {
      return normalizePath(
        path.join(this.localRoot, src.substring(6), ...filenames)
      );
    } else if (src.startsWith('cache:')) {
      return normalizePath(
        path.join(this.cacheRoot, src.substring(6), ...filenames)
      );
    } else {
      return normalizePath(src);
    }
  }
}

export const context = new GlobalContex();

function normalizePath(filename: string) {
  return filename.split(path.win32.sep).join(path.posix.sep);
}

function contains(parent: string, dir: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}
