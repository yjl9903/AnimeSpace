import path from 'node:path';
import { move, existsSync, rmSync } from 'fs-extra';

import createDebug from 'debug';
import Webtorrent from 'webtorrent';
import { green, lightBlue } from 'kolorist';

import { DOT, logger } from '../../logger';

import { createProgressBar } from '../utils';

import { Trackers } from './tracker';

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

  async download(downloadTasks: DownloadTask[]): Promise<void> {
    debug(downloadTasks);

    const formatSize = (size: number) =>
      (size / 1024 / 1024).toFixed(1) + ' MB';
    const multibar = createProgressBar<{ speed?: number }>({
      suffix(value, total, payload) {
        const progress = `${formatSize(value)} / ${formatSize(total)}`;
        const speed = payload.speed
          ? ' | Speed: ' + formatSize(payload.speed) + '/s'
          : '';
        return progress + speed;
      }
    });

    const tasks = downloadTasks.map((downloadTask): Promise<void> => {
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
            if (torrent.files.length === 0) {
              rej();
              return;
            }

            const finalPath = downloadTask.filename
              ? path.join(this.folder, downloadTask.filename)
              : undefined;

            // Torrent ---> File -- copy --> Final File
            if (torrent.files.length === 1) {
              // Final File exists
              if (finalPath && existsSync(finalPath)) {
                res();
                return;
              }
            } else {
              logger.warn(
                `Torrent "${
                  downloadTask.filename ?? torrent.name
                }" has multiple files`
              );
              for (const file of torrent.files) {
                logger.tab.warn(
                  `${DOT} ${file.name} (Size: ${formatSize(file.length)})`
                );
              }
            }

            const bar = multibar.create(torrent.name, torrent.length);

            torrent.on('download', () => {
              bar.update(torrent.downloaded, {
                speed: torrent.downloadSpeed
              });
            });

            torrent.once('done', async () => {
              bar.update(torrent.length);
              multibar.println(
                `  ${lightBlue('Info')} ${green('✓')} ${torrent.name}`
              );
              if (torrent.files.length === 1) {
                const file = torrent.files[0];
                const downloadedPath = file.path.startsWith(this.folder)
                  ? file.path
                  : path.join(this.folder, file.path);
                if (finalPath && finalPath !== downloadedPath) {
                  await move(downloadedPath, finalPath);
                }
                res();
              } else {
                const file = torrent.files.reduce((a, b) => {
                  if (a.length > b.length) return a;
                  else return b;
                });

                logger.warn(`Use "${file.name}" as the result`);

                if (finalPath && finalPath !== file.path) {
                  move(file.path, finalPath).then(() => {
                    // Clear other files
                    for (const file of torrent.files) {
                      try {
                        rmSync(file.path);
                      } catch {}
                    }
                    for (const file of torrent.files) {
                      try {
                        rmSync(path.dirname(file.path));
                      } catch {}
                    }
                    res();
                  });
                } else {
                  res();
                }
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
