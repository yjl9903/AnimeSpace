import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'node:child_process';

import type { ConsolaInstance } from 'consola';

import { dim } from '@breadc/color';
import { defu } from 'defu';
import { WebSocket } from 'libaria2';
import { MutableMap } from '@onekuma/map';
import { AnimeSystem, resolveStringArray } from '@animespace/core';

import { getProxy } from '../ufetch';

import { DefaultTrackers } from './trackers';
import { DownloadClient, DownloadOptions, DownloadState } from './base';

interface Aria2Options {
  /**
   * @default './download'
   */
  directory: string;

  /**
   * @default 'aria2c'
   */
  binary: string;

  /**
   * @default []
   */
  args: string[];

  /**
   * @default 'animespace'
   */
  secret: string;

  /**
   * @default false
   */
  proxy: string | boolean;

  /**
   * @default []
   */
  trackers: string[];

  debug: {
    pipe: boolean;

    log: string | undefined;
  };
}

export class Aria2Client extends DownloadClient {
  private options: Aria2Options;

  private consola: ConsolaInstance;

  private started = false;

  private client!: WebSocket.Client;

  private version!: string;

  private heartbeat!: NodeJS.Timeout;

  private gids = new Map<string, Task>();

  public constructor(system: AnimeSystem, options: Partial<Aria2Options> = {}) {
    super(system);
    this.consola = system.logger.withTag('aria2');
    this.options = defu(options, {
      binary: 'aria2c',
      directory: './download',
      secret: 'animespace',
      args: [],
      proxy: false,
      trackers: [...new Set([...(options.trackers ?? []), ...DefaultTrackers])],
      debug: { pipe: false, log: undefined },
    });
    this.options.directory = system.space.resolvePath(this.options.directory);
    if (this.options.debug.log) {
      this.options.debug.log = system.space.resolvePath(this.options.debug.log);
    }
  }

  public async download(
    key: string,
    magnet: string,
    options: DownloadOptions = {}
  ): Promise<{ files: string[] }> {
    await this.start();

    // Double check aria2c is started
    if (!this.started || !this.client) {
      throw new Error('aria2 has not started');
    }

    const proxy =
      typeof this.options.proxy === 'string' ? this.options.proxy : getProxy();
    const gid = await this.client
      .addUri([magnet], {
        dir: this.options.directory,
        'bt-save-metadata': true,
        'bt-tracker': this.options.trackers.join(','),
        'no-proxy': this.options.proxy === false ? true : false,
        'all-proxy': this.options.proxy !== false ? proxy : undefined,
      })
      .catch(error => {
        this.consola.error(error);
        return undefined;
      });

    if (!gid) {
      throw new Error('Start downloading task failed');
    }

    const that = this;
    const client = this.client;

    return new Promise((res, rej) => {
      const task: Task = {
        key,
        state: 'waiting',
        magnet,
        gids: {
          metadata: gid,
          files: new Set(),
        },
        progress: MutableMap.empty(),
        options,
        async onDownloadStart(gid) {
          const status = await client.tellStatus(gid);
          await that.updateStatus(task, status);
        },
        async onError() {
          rej(new Error('aria2c is stopped'));
        },
        async onDownloadError(gid) {
          that.gids.delete(gid);
          const status = await client.tellStatus(gid);
          await that.updateStatus(task, status);
          if (task.state === 'error') {
            if (
              status.errorMessage &&
              /File (.*) exists, but a control file\(\*.aria2\) does not exist/.test(
                status.errorMessage
              )
            ) {
              // Hack: handle file exists
              const files = status.files.map(f => f.path);
              res({ files });
            } else {
              rej(new Error(status.errorMessage));
            }
          }
        },
        async onBtDownloadComplete(gid) {
          that.gids.delete(gid);
          const status = await client.tellStatus(gid);

          // Force set the state of gid to complete, for it is still seeding
          await that.updateStatus(task, status, 'complete');

          if (task.state === 'complete') {
            const statuses = await Promise.all(
              [...task.gids.files].map(gid => client.tellStatus(gid))
            );
            const files = [];
            for (const status of statuses) {
              for (const f of status.files) {
                files.push(f.path);
              }
            }
            res({ files });
          }
        },
      };
      this.gids.set(gid, task);
    });
  }

  private registerCallback() {
    // Download Start
    this.client.addListener('aria2.onDownloadStart', async event => {
      const { gid } = event;
      if (this.gids.has(gid)) {
        await this.gids.get(gid)!.onDownloadStart(gid);
      }
    });

    // Download Error
    this.client.addListener('aria2.onDownloadError', async ({ gid }) => {
      if (this.gids.has(gid)) {
        await this.gids.get(gid)!.onDownloadError(gid);
      }
    });

    // Donwload complete but still seeding
    this.client.addListener('aria2.onBtDownloadComplete', async ({ gid }) => {
      if (this.gids.has(gid)) {
        await this.gids.get(gid)!.onBtDownloadComplete(gid);
      }
    });

    // Hearbeat to monitor download status
    this.heartbeat = setInterval(async () => {
      if (this.client && (await this.client.getVersion().catch(() => false))) {
        // Status OK
        await Promise.all(
          [...this.gids].map(async ([gid, task]) => {
            const status = await this.client.tellStatus(gid);
            await this.updateStatus(task, status);
            if (task.state === 'complete') {
              await task.onBtDownloadComplete(gid);
            } else if (task.state === 'error') {
              await task.onDownloadError(gid);
            }
          })
        );
      } else {
        const map = new MutableMap<string, Task>();
        for (const task of this.gids.values()) {
          map.set(task.key, task);
        }
        for (const task of map.values()) {
          await task.onError();
        }
        await this.close();
      }
    }, 500);
  }

  private async updateStatus(
    task: Task,
    status: IAria2DownloadStatus,
    nextState?: GidState
  ) {
    const oldState = task.state;
    const gid = status.gid;

    const connections = Number(status.connections);
    const speed = Number(status.downloadSpeed);

    // error and complete have no following state
    if (oldState === 'error' || oldState === 'complete') {
      return;
    }

    const force = !task.progress.has(gid);
    const progress = task.progress.getOrPut(gid, () => ({
      state: 'active',
      completed: status.completedLength,
      total: status.totalLength,
      connections,
      speed,
    }));
    const oldProgress = { ...progress };
    const updateProgress = () => {
      progress.completed = status.completedLength;
      progress.total = status.totalLength;
      progress.connections = connections;
      progress.speed = speed;
    };

    if (task.gids.metadata === gid) {
      switch (status.status) {
        case 'waiting':
          if (oldProgress.state === 'active') {
            updateProgress();
          }
          break;
        case 'active':
          if (oldProgress.state === 'active') {
            updateProgress();
          }
          if (task.state === 'waiting') {
            task.state = 'metadata';
          }
          break;
        case 'error':
          // Force set error state
          task.state = 'error';
          progress.state = 'error';
          updateProgress();
          break;
        case 'complete':
          // Delete metadata gid
          this.gids.delete(gid);
          // Force set complete state
          progress.state = 'complete';
          updateProgress();

          // Add followed files to current task
          const followed = resolveStringArray(status.followedBy);
          for (const f of followed) {
            task.gids.files.add(f);
            this.gids.set(f, task);
          }

          // Metadata ok, transfer to downloading state
          if (task.state === 'metadata' || task.state === 'waiting') {
            task.state = 'downloading';
          } else {
            (this.logger ?? this.consola).error(
              `Unexpected previous task state ${task.state}`
            );
          }

          break;
        case 'paused':
          (this.logger ?? this.consola).warn(
            `Download task ${task.key} was unexpectedly paused`
          );
          break;
        default:
          break;
      }

      // Trigger progress update
      const payload = {
        completed: progress.completed,
        total: progress.total,
        connections,
        speed,
      };
      const dirty =
        force ||
        oldState !== task.state ||
        oldProgress.state !== progress.state ||
        oldProgress.completed !== progress.completed ||
        oldProgress.total !== progress.total ||
        oldProgress.connections !== progress.connections ||
        oldProgress.speed !== progress.speed;

      if (task.state === 'waiting' || task.state === 'metadata') {
        if (dirty) {
          await task.options.onMetadataProgress?.(payload);
        }
      } else if (task.state === 'downloading') {
        await task.options.onMetadataComplete?.(payload);
      } else if (task.state === 'error') {
        await task.options.onError?.({
          message: status.errorMessage,
          code: status.errorCode,
        });
      } else {
        (this.logger ?? this.consola).error(
          `Download task ${task.key} entered unexpectedly state ${task.state}`
        );
      }
    } else {
      switch (status.status) {
        case 'waiting':
        case 'active':
          if (oldProgress.state === 'active') {
            updateProgress();
          }
          break;
        case 'error':
          // Force set error state
          task.state = 'error';
          progress.state = 'error';
          updateProgress();
          break;
        case 'complete':
          // Force set complete state
          progress.state = 'complete';
          updateProgress();
          break;
        case 'paused':
          (this.logger ?? this.consola).warn(
            `Download task ${task.key} was unexpectedly paused`
          );
          break;
        default:
          break;
      }

      if (nextState) {
        progress.state = nextState;
      }

      let active = false;
      let completed = BigInt(0),
        total = BigInt(0);
      for (const p of task.progress.values()) {
        completed += p.completed;
        total += p.total;
        if (p.state === 'active') {
          active = true;
        }
      }

      const payload = { completed, total, connections, speed };
      const dirty =
        force ||
        oldState !== task.state ||
        oldProgress.state !== progress.state ||
        oldProgress.completed !== progress.completed ||
        oldProgress.total !== progress.total ||
        oldProgress.connections !== progress.connections ||
        oldProgress.speed !== progress.speed;

      if (progress.state === 'active') {
        if (dirty) {
          await task.options.onProgress?.(payload);
        }
      } else if (progress.state === 'complete') {
        if (active) {
          if (dirty) {
            await task.options.onProgress?.(payload);
          }
        } else {
          // Finish all the download
          task.state = 'complete';
          await task.options.onComplete?.(payload);
        }
      } else if (progress.state === 'error') {
        await task.options.onError?.({
          message: status.errorMessage,
          code: status.errorCode,
        });
      }
    }
  }

  public async start(force: boolean = false): Promise<void> {
    if (!force) {
      if (this.started || this.client || this.version) return;
    }
    this.started = true;

    if (this.options.debug.log) {
      try {
        await fs.ensureDir(path.dirname(this.options.debug.log));
        if (await fs.exists(this.options.debug.log)) {
          await fs.rm(this.options.debug.log);
        }
        this.consola.info(
          dim(`aria2 debug log will be written to ${this.options.debug.log}`)
        );
      } catch {}
    }

    // Random a new port
    const rpcPort = 16800 + Math.round(Math.random() * 10000);
    const listenPort = 26800 + Math.round(Math.random() * 10000);

    const env = { ...process.env };
    delete env['all_proxy'];
    delete env['ALL_PROXY'];
    delete env['http_proxy'];
    delete env['https_proxy'];
    delete env['HTTP_PROXY'];
    delete env['HTTPS_PROXY'];
    const child = spawn(
      this.options.binary,
      [
        // Bittorent
        // https://aria2.github.io/manual/en/html/aria2c.html#cmdoption-bt-detach-seed-only
        `--bt-detach-seed-only`,
        `--dht-listen-port=${listenPort + 101}-${listenPort + 200}`,
        `--listen-port=${listenPort}-${listenPort + 100}`,
        // RPC related
        '--enable-rpc',
        '--rpc-listen-all',
        '--rpc-allow-origin-all',
        `--rpc-listen-port=${rpcPort}`,
        `--rpc-secret=${this.options.secret}`,
        // Debug log
        ...(this.options.debug.log ? [`--log=${this.options.debug.log}`] : []),
        // Rest arguments
        ...this.options.args,
      ],
      { cwd: process.cwd(), env }
    );

    return new Promise((res, rej) => {
      if (this.options.debug.pipe) {
        child.stdout.on('data', chunk => {
          console.log(chunk.toString());
        });
        child.stderr.on('data', chunk => {
          console.log(chunk.toString());
        });
      }

      child.stdout.once('data', async _chunk => {
        try {
          this.client = new WebSocket.Client({
            protocol: 'ws',
            host: 'localhost',
            port: rpcPort,
            auth: {
              secret: this.options.secret,
            },
          });
          this.gids.clear();
          this.registerCallback();

          const version = await this.client.getVersion();
          this.version = version.version;
          this.consola.info(dim(`aria2 v${this.version} is running`));
          res();
        } catch (error) {
          rej(error);
        }
      });

      child.addListener('error', async error => {
        this.consola.error(dim(`Some error happened in aria2`));
        await this.close().catch(() => {});
      });

      child.addListener('exit', async () => {
        await this.close().catch(() => {});
      });
    });
  }

  public async close() {
    clearInterval(this.heartbeat);
    if (this.client) {
      const version = this.version;
      const res = await this.client.shutdown().catch(() => 'OK');
      await this.client.close().catch(() => {});

      // @ts-ignore
      this.client = undefined;
      // @ts-ignore
      this.version = undefined;
      this.started = false;
      if (res === 'OK') {
        this.consola.info(dim(`aria2 v${version} has been closed`));
        return true;
      } else {
        return false;
      }
    } else {
      // @ts-ignore
      this.client = undefined;
      // @ts-ignore
      this.version = undefined;
      this.started = false;
      return false;
    }
  }

  public async clean(extensions: string[] = []) {
    const files = await fs.readdir(this.options.directory).catch(() => []);
    await Promise.all(
      files.map(async file => {
        if (extensions.includes(path.extname(file).toLowerCase())) {
          const p = path.join(this.options.directory, file);
          try {
            await fs.remove(p);
          } catch (error) {
            this.consola.error(error);
          }
        }
      })
    );
  }
}

type GidState = 'active' | 'error' | 'complete';

interface Task {
  key: string;

  state: DownloadState;

  magnet: string;

  gids: {
    metadata: string;

    files: Set<string>;
  };

  progress: MutableMap<
    string,
    {
      state: GidState;
      total: bigint;
      completed: bigint;
      connections: number;
      speed: number;
    }
  >;

  options: DownloadOptions;

  onError: () => Promise<void>;

  onDownloadStart: (gid: string) => Promise<void>;

  onDownloadError: (gid: string) => Promise<void>;

  onBtDownloadComplete: (gid: string) => Promise<void>;
}

type IAria2DownloadStatus = Awaited<ReturnType<WebSocket.Client['tellStatus']>>;
