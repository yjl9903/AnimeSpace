import { spawn } from 'node:child_process';

import type { AnimeSystem } from '@animespace/core';

import { defu } from 'defu';
import { WebSocket } from 'libaria2';

import { DownloadClient, DownloadOptions } from './base';

interface Aria2Options {
  port: number;

  secret: string;

  args: string[];
}

export class Aria2Client extends DownloadClient {
  private options: Aria2Options;

  private started = false;

  private client!: WebSocket.Client;

  private version!: string;

  public constructor(system: AnimeSystem, options: { port?: number } = {}) {
    super(system);
    this.options = defu(options, {
      port: 6800,
      secret: 'animespace',
      args: []
    });
  }

  public async download(
    magnet: string,
    outDir: string,
    options: DownloadOptions = {}
  ) {
    await this.start();
  }

  public async start(): Promise<void> {
    if (this.started || this.client || this.version) return;
    this.started = true;

    const child = spawn(
      '/usr/local/bin/aria2c',
      [
        '--enable-rpc',
        '--rpc-listen-all',
        '--rpc-allow-origin-all',
        `--rpc-listen-port=${this.options.port}`,
        `--rpc-secret=${this.options.secret}`
      ],
      { cwd: process.cwd(), env: process.env }
    );

    return new Promise((res) => {
      child.stdout.once('data', async (_chunk) => {
        this.client = new WebSocket.Client({
          host: 'localhost',
          port: this.options.port,
          auth: {
            secret: this.options.secret
          }
        });
        const version = await this.client.getVersion();
        this.version = version.version;
        this.system.logger.info(`aria2 v${this.version} is running`);
        res();
      });
    });
  }

  public async close() {
    const version = this.version;
    const res = await this.client.shutdown();
    await this.client.close();
    if (res === 'OK') {
      // @ts-ignore
      this.client = undefined;
      // @ts-ignore
      this.version = undefined;
      this.system.logger.info(`aria2 v${version} has been closed`);
      this.started = false;
      return true;
    } else {
      return false;
    }
  }
}
