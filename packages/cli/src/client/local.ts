import { SyncClient } from './client';
import { OnairAnime } from './types';

export class LocalSyncClient extends SyncClient {
  static async init(): Promise<LocalSyncClient> {
    return new LocalSyncClient();
  }

  fetchOnair(): Promise<OnairAnime[]> {
    throw new Error('Method not implemented.');
  }

  syncOnair(): Promise<OnairAnime[]> {
    throw new Error('Method not implemented.');
  }

  removeOnair(bgmId: string): void {
    throw new Error('Method not implemented.');
  }

  updateOnair(onair: OnairAnime): void {
    throw new Error('Method not implemented.');
  }
}
