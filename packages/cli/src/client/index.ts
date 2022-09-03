import { context } from '../context';

import { LocalSyncClient } from './local';
import { RemoteSyncClient } from './remote';

export * from './remote';

export * from './client';

export * from './types';

export async function initClient() {
  const config = await context.getSyncConfig();
  if (config.remote && config.remote.baseURL && config.remote.token) {
    return await RemoteSyncClient.init();
  } else {
    return await LocalSyncClient.init();
  }
}
