import { DownloadClient } from './base';

export class WebtorrentClient extends DownloadClient {
  async start() {}

  async close() {
    return true;
  }
}
