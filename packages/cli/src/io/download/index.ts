import * as path from 'node:path';
import { Transform, pipeline } from 'stream';
import { createWriteStream, existsSync, removeSync } from 'fs-extra';

import axios from 'axios';
import onDeath from 'death';
import createDebug from 'debug';

import { createProgressBar } from '../utils';

const debug = createDebug('anime:download');

export interface DownloadPayload {
  filepath: string;
  url: string;
}

export async function download(...payloads: DownloadPayload[]): Promise<void> {
  const formatSize = (size: number) => (size / 1024 / 1024).toFixed(1) + ' MB';
  const multibar = createProgressBar<{ speed?: number }>({
    suffix(value, total, payload) {
      const progress = `${formatSize(value)} / ${formatSize(total)}`;
      const speed = payload.speed
        ? ' | Speed: ' + formatSize(payload.speed) + '/s'
        : '';
      return progress + speed;
    }
  });

  const down = async (payload: DownloadPayload): Promise<void> => {
    if (existsSync(payload.filepath)) {
      return;
    }

    const fetch = async () => {
      for (let i = 0; i < 5; i++) {
        try {
          return await axios.get(payload.url, {
            responseType: 'stream'
          });
        } catch (error) {
          debug(error);
        }
      }
    };

    const resp = await fetch();
    if (!resp) return;
    const { data, headers } = resp;

    const bar = multibar.create(
      path.basename(payload.filepath),
      +headers['content-length']
    );

    const writeStream = createWriteStream(payload.filepath);

    const cancel = onDeath(() => {
      removeSync(payload.filepath);
    });

    return new Promise((res, rej) => {
      pipeline(
        data,
        new Transform({
          transform(chunk, _encoding, callback) {
            bar.increment(chunk.length);
            this.push(chunk);
            callback();
          }
        }),
        writeStream,
        (err) => {
          if (err) {
            removeSync(payload.filepath);
            rej(err);
          } else {
            cancel();
            res();
          }
        }
      );
    });
  };

  await Promise.all(payloads.map((p) => down(p)));

  multibar.finish();
}
