import path from 'pathe';

import { Anime, AnimeSystem, onDeath, onUnhandledRejection } from '@animespace/core';
import { bold, cyan, lightGreen, lightRed, lightYellow, link } from '@breadc/color';

import { ANIMEGARDEN } from '../constant';
import { DownloadClient } from '../download';
import { createProgressBar } from '../logger';

import type { Task } from './types';

export async function runDownloadTask(
  system: AnimeSystem,
  anime: Anime,
  videos: Task[],
  client: DownloadClient
) {
  if (videos.length === 0) return;

  await client.start();

  const multibar = createProgressBar<{
    speed: number;
    connections: number;
    state: string;
    completed: bigint;
    total: bigint;
  }>({
    suffix(value, total, payload) {
      if (value >= 100) {
        return 'OK';
      }

      const formatSize = (size: number) =>
        size < 1024 * 1024
          ? (size / 1024).toFixed(1) + ' KB'
          : (size / 1024 / 1024).toFixed(1) + ' MB';

      let text = '';
      if (payload.state) {
        text += payload.state;
        text += ` | ${Number(payload.completed)} B / ${Number(payload.total)} B`;
      } else {
        text += `${formatSize(Number(payload.completed))} / ${formatSize(Number(payload.total))}`;
        if (payload.speed) {
          text += ` | Speed: ${formatSize(payload.speed)}/s`;
        }
      }
      if (payload.connections) {
        text += ` | Connections: ${payload.connections}`;
      }
      return text;
    }
  });

  const systemLogger = system.logger.withTag('animegarden');
  const multibarLogger = {
    log(message: string) {
      multibar.println(`${message}`);
    },
    info(message: string) {
      multibar.println(`${cyan('Info')} ${message}`);
    },
    warn(message: string) {
      multibar.println(`${lightYellow('Warn')} ${message}`);
    },
    error(message: string) {
      multibar.println(`${lightRed('Error')} ${message}`);
    }
  };
  client.setLogger(multibarLogger);

  const cancelDeath = onDeath(async () => {
    multibar.finish();
  });
  const cancelUnhandledRej = onUnhandledRejection(() => {
    multibar.finish();
  });
  const cancelRefresh = loop(
    async () => {
      if (anime.dirty) {
        await anime.writeLibrary();
        systemLogger.log(
          lightGreen(`Write`) + bold(` ${anime.plan.title} `) + lightGreen(`library file OK`)
        );
      }
    },
    10 * 60 * 1000
  ); // 10 minutes

  const tasks = videos.map(async (task) => {
    const bar = multibar.create(`${bold(task.video.filename)}`, 100);

    try {
      const { files } = await client.download(task.video.filename, task.resource.magnet, {
        onStart() {
          bar.update(0, {
            speed: 0,
            connections: 0,
            completed: BigInt(0),
            total: BigInt(0),
            state: 'Downloading metadata'
          });
        },
        onMetadataProgress(progress) {
          bar.update(0, {
            ...progress,
            state: 'Downloading metadata'
          });
        },
        onProgress(payload) {
          const completed = Number(payload.completed);
          const total = Number(payload.total);
          const value =
            payload.total > 0 ? +(Math.ceil((1000.0 * completed) / total) / 10).toFixed(1) : 0;
          bar.update(value, { ...payload, state: '' });
        },
        onComplete() {
          bar.update(100);
        }
      });
      bar.update(100);
      bar.remove();

      multibarLogger.log(
        `${lightGreen('Download')} ${bold(task.video.filename)} ${lightGreen('OK')}`
      );

      if (files.length === 1) {
        const file = files[0];
        if (task.video.naming === 'auto') {
          // Hack: update filename extension when auto naming
          task.video.filename = anime.formatFilename({
            fansub: task.video.fansub,
            episode: task.video.episode,
            extension: path.extname(file).slice(1) || 'mp4'
          });
        }

        // First resolve episode number
        const resolvedEpisode = anime.resolveEpisode(task.video.episode, task.video.fansub);
        const resolvedSeason = anime.resolveSeason(task.video.type, task.video.season);
        const library = (await anime.library()).videos;

        // Find old video to be removed
        const oldVideo = library.find(
          (v) =>
            v.source.type === ANIMEGARDEN &&
            anime.resolveEpisode(v.episode, v.fansub) === resolvedEpisode &&
            (anime.resolveSeason(v.type, v.season) ?? 1) === (resolvedSeason ?? 1) // Find same episode after being resolved
        );

        // Upload progress bar
        const bar = multibar.create(`${bold(task.video.filename)}`, 100);
        bar.update(0, {
          speed: 0,
          connections: 0,
          completed: BigInt(0),
          total: BigInt(0),
          state: 'Copying'
        });

        // Copy video to storage
        try {
          const copyDelta = await anime.addVideoByCopy(file, task.video, {
            onProgress({ current, total: _total }) {
              const total = _total ?? current;
              const value =
                total > 0 ? +(Math.ceil((1000.0 * current) / total) / 10).toFixed(1) : 0;
              bar.update(value, {
                speed: 0,
                connections: 0,
                completed: BigInt(current),
                total: BigInt(total),
                state: 'Copying'
              });
            }
          });

          if (copyDelta) {
            const detailURL = `https://garden.onekuma.cn/resource/${task.video.source
              .magnet!.split('/')
              .at(-1)}`;
            copyDelta.log = link(task.video.filename, detailURL);

            // Remove old animegarden video to keep storage clean
            if (oldVideo) {
              multibarLogger.log(`${lightRed('Removing')} ${bold(oldVideo.filename)}`);
              await anime.removeVideo(oldVideo);
            }

            multibarLogger.log(
              `${lightGreen('Copy')} ${bold(task.video.filename)} ${lightGreen('OK')}`
            );
          }
        } finally {
          bar.stop();
          bar.remove();
        }
      } else {
        multibar.println(
          `${lightYellow(`Warn`)} Resource ${link(
            task.resource.title,
            task.resource.href
          )} has multiple files`
        );
      }
    } catch (error) {
      const defaultMessage = `Download ${link(task.resource.title, task.resource.href)} failed`;
      if (error instanceof Error && error?.message) {
        multibarLogger.error(error.message ?? defaultMessage);
        systemLogger.error(error);
      } else {
        multibarLogger.error(defaultMessage);
      }
    } finally {
      bar.stop();
    }
  });

  try {
    await Promise.all(tasks);
    multibar.finish();
  } catch (error) {
    multibar.finish();
    systemLogger.log(lightRed(`Failed to downloading resources of ${bold(anime.plan.title)}`));
    systemLogger.error(error);
  } finally {
    if (anime.dirty) {
      await anime.writeLibrary();
      systemLogger.log(
        lightGreen(`Write`) + bold(` ${anime.plan.title} `) + lightGreen(`library file OK`)
      );
    }
  }

  cancelRefresh();
  cancelUnhandledRej();
  cancelDeath();
}

function loop(fn: () => Promise<void>, interval: number) {
  let timestamp: NodeJS.Timeout;
  const wrapper = async () => {
    await fn();
    timestamp = setTimeout(wrapper, interval);
  };
  timestamp = setTimeout(wrapper, interval);

  const cancel = onDeath(() => {
    clearTimeout(timestamp);
  });

  return () => {
    clearTimeout(timestamp);
    cancel();
  };
}
