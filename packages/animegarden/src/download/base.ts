import type { AnimeSystem } from '@animespace/core';

export abstract class DownloadClient {
  protected system: AnimeSystem;

  public constructor(system: AnimeSystem) {
    this.system = system;
  }

  public abstract download(
    key: string,
    magnet: string,
    options?: DownloadOptions
  ): Promise<void>;

  public abstract start(): Promise<void>;

  public abstract close(): Promise<boolean>;
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
