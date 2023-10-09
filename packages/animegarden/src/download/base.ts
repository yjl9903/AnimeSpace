import type { AnimeSystem } from '@animespace/core';

interface DownloadLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export abstract class DownloadClient {
  private _system: AnimeSystem;

  protected logger?: DownloadLogger;

  public constructor(system: AnimeSystem) {
    this._system = system;
  }

  public get system() {
    return this._system;
  }

  public set system(system: AnimeSystem) {
    this._system = system;
    this.initialize(system);
  }

  public setLogger(logger: DownloadLogger) {
    this.logger = logger;
  }

  public abstract download(
    key: string,
    magnet: string,
    options?: DownloadOptions
  ): Promise<{ files: string[] }>;

  public abstract initialize(system: AnimeSystem): void;

  public abstract start(): Promise<void>;

  public abstract close(): Promise<boolean>;

  public async clean(extensions: string[] = ['.mp4', '.mkv']) {}
}

type MayPromise<T> = T | Promise<T>;

export type DownloadState =
  | 'waiting'
  | 'metadata'
  | 'downloading'
  | 'complete'
  | 'error';

export interface DownloadProgress {
  total: bigint;

  completed: bigint;

  connections: number;

  speed: number;
}

export interface DownloadOptions {
  onStart?: () => MayPromise<void>;

  onMetadataProgress?: (payload: DownloadProgress) => MayPromise<void>;

  onMetadataComplete?: (payload: DownloadProgress) => MayPromise<void>;

  onProgress?: (payload: DownloadProgress) => MayPromise<void>;

  onComplete?: (payload: DownloadProgress) => MayPromise<void>;

  onError?: (error: { message?: string; code?: number }) => MayPromise<void>;
}
