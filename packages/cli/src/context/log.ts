import type { GlobalContex } from './index';

import fs from 'fs-extra';
import path from 'node:path';

export class LogContext<T = any> {
  readonly filepath: string;

  constructor(ctx: GlobalContex, name: string) {
    this.filepath = path.join(ctx.root, name);
  }

  async list(): Promise<T[]> {
    if (fs.existsSync(this.filepath)) {
      const content = fs.readFileSync(this.filepath, 'utf-8');
      return JSON.parse(content);
    } else {
      return [];
    }
  }

  async append(log: T): Promise<void> {
    const logs = await this.list();
    logs.push(log);
    fs.writeFileSync(this.filepath, JSON.stringify(logs, null, 2), 'utf-8');
  }
}
