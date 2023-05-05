import { DownloadClient, DownloadOptions } from './base';

export class WebtorrentClient extends DownloadClient {
  public async download(
    magnet: string,
    outDir: string,
    options?: DownloadOptions | undefined
  ): Promise<{ files: string[] }> {
    throw new Error('Method not implemented.');
  }

  public async start() {}

  public async close() {
    return true;
  }
}
