import type { OnairAnime } from './types';

export abstract class SyncClient {
  /**
   * Current onair bangumis
   */
  readonly onair: OnairAnime[] = [];

  /**
   * Onair bangumis to be uploaded
   */
  readonly newOnair: OnairAnime[] = [];

  abstract fetchOnair(): Promise<OnairAnime[]>;

  abstract syncOnair(): Promise<OnairAnime[]>;

  abstract removeOnair(bgmId: string): void;

  abstract updateOnair(onair: OnairAnime): void;
}
