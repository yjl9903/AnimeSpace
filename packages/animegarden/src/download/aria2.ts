import { spawn } from 'node:child_process';

import type { AnimeSystem } from '@animespace/core';

import { defu } from 'defu';
import { WebSocket } from 'libaria2';

import { getProxy } from '../ufetch';

import { Aria2Trackers } from './trackers';
import { DownloadClient, DownloadOptions } from './base';

interface Aria2Options {
  directory: string;

  port: number;

  secret: string;

  args: string[];

  proxy: string | boolean;
}

export class Aria2Client extends DownloadClient {
  private options: Aria2Options;

  private started = false;

  private client!: WebSocket.Client;

  private version!: string;

  private heartbeat!: NodeJS.Timer;

  private gids = new Map<
    string,
    { magnet: string; outDir: string; onComplete: () => void }
  >();

  public constructor(system: AnimeSystem, options: { port?: number } = {}) {
    super(system);
    this.options = defu(options, {
      directory: './temp',
      port: 6800,
      secret: 'animespace',
      args: [],
      proxy: false
    });
    this.options.directory = system.space.resolvePath(this.options.directory);
  }

  public async download(
    magnet: string,
    outDir: string,
    options: DownloadOptions = {}
  ): Promise<void> {
    await this.start();
    const proxy =
      typeof this.options.proxy === 'string' ? this.options.proxy : getProxy();
    const gid = await this.client.addUri([magnet], {
      dir: this.options.directory,
      'bt-tracker': Aria2Trackers,
      'no-proxy': this.options.proxy === false ? true : false,
      'http-proxy': this.options.proxy !== false ? proxy : undefined,
      'https-proxy': this.options.proxy !== false ? proxy : undefined
    });

    this.system.logger.info(`Send download task ${gid}`);
    return new Promise((res) => {
      this.gids.set(gid, {
        magnet,
        outDir,
        onComplete() {
          res();
        }
      });
    });
  }

  private registerCallback() {
    this.client.addListener('aria2.onDownloadStart', async (event) => {
      const { gid } = event;
      if (this.gids.has(gid)) {
        this.system.logger.info(`Download ${gid} started`);
        const status = await this.client.tellStatus(gid);
      }
    });
    this.client.addListener('aria2.onDownloadError', (event) => {
      const { gid } = event;
      if (this.gids.has(gid)) {
        this.system.logger.info(`Download ${gid} Error`);
      }
    });
    this.client.addListener('aria2.onDownloadComplete', (event) => {
      const { gid } = event;
      if (this.gids.has(gid)) {
        this.system.logger.info(`Download ${gid} OK`);
        const entry = this.gids.get(gid)!;
        entry.onComplete();
        this.gids.delete(gid);
      }
    });
    this.client.addListener('aria2.onBtDownloadComplete', () => {});

    // Hearbeat to monitor download status
    this.heartbeat = setInterval(async () => {
      for (const gid of this.gids.keys()) {
        const status = await this.client.tellStatus(gid);
        if (status.errorCode) {
          console.log('Error');
        } else {
          console.log(
            `Downloading ${status.status} (peers: ${status.connections}): ${status.completedLength} / ${status.totalLength}`
          );
        }
      }
    }, 500);
  }

  public async start(): Promise<void> {
    if (this.started || this.client || this.version) return;
    this.started = true;

    const env = { ...process.env };
    delete env['all_proxy'];
    delete env['ALL_PROXY'];
    delete env['http_proxy'];
    delete env['https_proxy'];
    delete env['HTTP_PROXY'];
    delete env['HTTPS_PROXY'];
    const child = spawn(
      '/usr/local/bin/aria2c',
      [
        '--enable-rpc',
        '--rpc-listen-all',
        '--rpc-allow-origin-all',
        `--rpc-listen-port=${this.options.port}`,
        `--rpc-secret=${this.options.secret}`
      ],
      { cwd: process.cwd(), env }
    );

    return new Promise((res) => {
      child.stdout.on('data', (chunk) => {
        console.log(chunk.toString());
      });

      child.stdout.once('data', async (_chunk) => {
        this.client = new WebSocket.Client({
          protocol: 'ws',
          host: 'localhost',
          port: this.options.port,
          auth: {
            secret: this.options.secret
          }
        });
        this.registerCallback();

        const version = await this.client.getVersion();
        this.version = version.version;
        this.system.logger.info(`aria2 v${this.version} is running`);
        res();
      });
    });
  }

  public async close() {
    clearInterval(this.heartbeat);
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
