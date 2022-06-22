import Webtorrent from 'webtorrent';
import path from 'node:path';
import { green } from 'kolorist';
import { existsSync } from 'fs-extra';

import { Trackers } from './tracker';
import { createProgressBar } from '../utils';

export class TorrentClient {
  private readonly client: Webtorrent.Instance;
  private readonly folder: string;

  constructor(folder: string) {
    this.client = new Webtorrent({});
    this.folder = folder;
  }

  async download(magnetURIs: string[]): Promise<void> {
    const formatSize = (size: number) =>
      (size / 1024 / 1024).toFixed(1) + ' MB';
    const multibar = createProgressBar<{ speed?: number }>({
      suffix(value, total, payload) {
        const progress = `${formatSize(value)} / ${formatSize(total)}`;
        const speed = payload.speed
          ? 'Speed: ' + formatSize(payload.speed) + '/s'
          : '';
        return progress + ' | ' + speed;
      }
    });

    const tasks = magnetURIs.map((magnetURI): Promise<void> => {
      return new Promise((res, rej) => {
        this.client.add(
          magnetURI,
          {
            path: this.folder,
            announce: Trackers
          },
          (torrent) => {
            // File exists
            for (const file of torrent.files) {
              if (existsSync(path.join(file.path))) {
                res();
                return;
              }
            }

            const bar = multibar.create(torrent.name, torrent.length);

            torrent.on('download', () => {
              bar.update(torrent.downloaded, {
                speed: torrent.downloadSpeed
              });
            });

            torrent.once('done', () => {
              bar.update(torrent.length);
              multibar.println(`  ${green('√')} ${torrent.name}`);
              res();
            });

            torrent.once('error', (err) => {
              if (typeof err === 'string') {
                rej(new Error(err));
              } else {
                rej(err);
              }
            });
          }
        );
      });
    });

    try {
      await Promise.all(tasks);
    } catch (error) {
      // console.log(error);
    }

    multibar.finish();
  }

  destroy(): Promise<void> {
    return new Promise((res) => {
      this.client.destroy(() => {
        res();
      });
    });
  }
}
