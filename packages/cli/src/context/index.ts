import * as fs from 'fs-extra';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { load, dump } from 'js-yaml';

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

  private configCache: any;

  constructor() {
    this.root = path.join(homedir(), '.animepaste');
    this.config = path.join(this.root, GlobalContex.ConfigFileName);
  }

  async init() {
    if (!(await fs.pathExists(this.root))) {
      fs.mkdirp(this.root);
    }
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
}

export interface GlobalConfig {
  plan: [];

  store: {};
}
