import path from 'node:path';

import createDebug from 'debug';
import Webtorrent from 'webtorrent';
import { green, lightBlue } from 'kolorist';
import { move, existsSync } from 'fs-extra';

import { Trackers } from './tracker';
import { createProgressBar } from '../utils';

const debug = createDebug('anime:torrent');

interface DownloadTask {
  magnetURI: string;
  filename?: string;
}

export class TorrentClient {
  private readonly client: Webtorrent.Instance;
  private readonly folder: string;

  constructor(folder: string) {
    this.client = new Webtorrent({});
    this.folder = folder;
    this.client.setMaxListeners(25);
  }

  async download(downloadTask: DownloadTask[]): Promise<void> {
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

    const tasks = downloadTask.map((downloadTask): Promise<void> => {
      if (downloadTask.filename) {
        const finalPath = path.join(this.folder, downloadTask.filename);
        if (existsSync(finalPath)) {
          return Promise.resolve();
        }
      }

      return new Promise((res, rej) => {
        this.client.add(
          downloadTask.magnetURI,
          {
            path: this.folder,
            announce: Trackers
          },
          (torrent) => {
            // Torrent should have only one file
            if (torrent.files.length > 1) {
              return;
            }

            // Torrent ---> File -- copy --> Final File
            const file = torrent.files[0];
            const finalPath = downloadTask.filename
              ? path.join(this.folder, downloadTask.filename)
              : file.path;
            // Final File exists
            if (existsSync(finalPath)) {
              res();
              return;
            }

            const bar = multibar.create(torrent.name, torrent.length);

            torrent.on('download', () => {
              bar.update(torrent.downloaded, {
                speed: torrent.downloadSpeed
              });
            });

            torrent.once('done', () => {
              bar.update(torrent.length);
              multibar.println(
                `  ${lightBlue('Info')} ${green('✓')} ${torrent.name}`
              );
              if (finalPath !== file.path) {
                move(file.path, finalPath).then(() => res());
              } else {
                res();
              }
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
      debug(error);
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
