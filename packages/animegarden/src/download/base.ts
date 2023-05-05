import type { AnimeSystem } from '@animespace/core';

export abstract class DownloadClient {
  protected system: AnimeSystem;

  public constructor(system: AnimeSystem) {
    this.system = system;
  }

  public abstract start(): Promise<void>;

  public abstract close(): Promise<boolean>;
}
