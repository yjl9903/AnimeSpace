import type { AnimeSystem } from '@animespace/core';

import { Aria2Client } from './aria2';
import { DownloadClient } from './base';
import { WebtorrentClient } from './webtorrent';

export type DownloadProviders = 'webtorrent' | 'aria2' | 'qbittorrent';

export function makeClient(
  provider: DownloadProviders,
  system: AnimeSystem,
  options: any
): DownloadClient {
  switch (provider) {
    case 'aria2':
      return new Aria2Client(system, options);
    case 'qbittorrent':
    case 'webtorrent':
    default:
      return new WebtorrentClient(system);
  }
}
