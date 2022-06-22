import * as fs from 'fs-extra';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { load, dump } from 'js-yaml';

import type { LocalVideoInfo } from '../types';

import { LogContext } from './log';

const DefaultGlobalConfig: GlobalConfig = {
  plan: [],
  store: {
    ali: {
      accessKeyId: '',
      accessKeySecret: '',
      endpoint: ''
    }
  }
};

export class GlobalContex {
  static ConfigFileName = 'config.yaml';

  readonly root: string;
  readonly config: string;
  readonly cacheRoot: string;

  readonly storeLog: LogContext<LocalVideoInfo>;

  private configCache: any;

  constructor() {
    this.root = path.join(homedir(), '.animepaste');
    this.cacheRoot = path.join(this.root, 'cache');
    this.config = path.join(this.root, GlobalContex.ConfigFileName);
    this.storeLog = new LogContext(this, 'store.json');
  }

  async init() {
    await fs.ensureDir(this.root);
    await fs.ensureDir(path.join(this.root, 'anime'));
    await fs.ensureDir(path.join(this.root, 'cache'));
    if (!(await fs.pathExists(this.config))) {
      fs.writeFile(
        this.config,
        dump(DefaultGlobalConfig, { indent: 2 }).replace('store', '\nstore'),
        'utf-8'
      );
    }
  }

  async loadConfig<T = any>(): Promise<T> {
    const content = await fs.readFile(this.config, 'utf-8');
    this.configCache = load(content);
    return this.configCache;
  }

  async getStoreConfig<T = any>(key: string): Promise<T> {
    return (await this.loadConfig()).store[key];
  }

  /**
   * Copy file from "src" to "root/dst/basename(src)"
   *
   * @param src
   * @param dst
   */
  async copy(src: string, dst: 'cache' | 'anime') {
    const filepath = path.join(this.root, dst, path.basename(src));
    await fs.copy(src, filepath);
    return filepath;
  }
}

export interface GlobalConfig {
  plan: [];

  store: {};
}
