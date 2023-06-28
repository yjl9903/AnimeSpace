import path from 'node:path';

import type { Resource } from 'animegarden';

import {
  Anime,
  AnimeSystem,
  LocalVideo,
  onDeath,
  onUnhandledRejection
} from '@animespace/core';
import { Parser } from 'anitomy';
import { MutableMap } from '@onekuma/map';
import {
  bold,
  cyan,
  lightGreen,
  lightRed,
  lightYellow,
  link
} from '@breadc/color';

import { ANIMEGARDEN } from './constant';
import { DownloadClient } from './download';
import { createProgressBar } from './logger';

const parser = new Parser();

type Task = { video: LocalVideo; resource: Resource };

export async function generateDownloadTask(
  system: AnimeSystem,
  anime: Anime,
  resources: Resource[],
  force = false
) {
  const library = await anime.library();
  const ordered = groupResources(system, anime, resources);
  const videos: Task[] = [];

  for (const [ep, { fansub, resources }] of ordered) {
    resources.sort((lhs, rhs) => {
      const tl = lhs.title;
      const tr = rhs.title;

      for (
        const [_, order] of Object.entries(
          system.space.preference.keyword.order
        )
      ) {
        for (const k of order) {
          const key = k.toLowerCase();
          const hl = tl.toLowerCase().indexOf(key) !== -1;
          const hr = tr.toLowerCase().indexOf(key) !== -1;
          if (hl !== hr) {
            if (hl) {
              return -1;
            } else {
              return 1;
            }
          }
        }
      }

      return (
        new Date(rhs.createdAt).getTime() - new Date(lhs.createdAt).getTime()
      );
    });

    const res = resources[0];
    if (force || !library.videos.find(r => r.source.magnet === res.href)) {
      const info = parser.parse(res.title)!;
      videos.push({
        video: {
          filename: anime.formatFilename({
            fansub,
            episode: info.episode.number, // Raw episode number
            extension: info.file.extension
          }),
          naming: 'auto',
          fansub: fansub,
          episode: info.episode.number, // Raw episode number
          source: {
            type: 'AnimeGarden',
            magnet: res.href
          }
        },
        resource: res
      });
    }
  }

  videos.sort((lhs, rhs) => lhs.video.episode! - rhs.video.episode!);

  return videos;
}

function groupResources(
  system: AnimeSystem,
  anime: Anime,
  resources: Resource[]
) {
  const logger = system.logger.withTag('animegarden');
  const map = new MutableMap<number, MutableMap<string, Resource[]>>([]);

  for (const r of resources) {
    // Resource title should not have exclude keywords
    if (
      system.space.preference.keyword.exclude.some(
        k => r.title.indexOf(k) !== -1
      )
    ) {
      continue;
    }
    // Resource fansub shoulde be included
    if (r.fansub && !anime.plan.fansub.includes(r.fansub.name)) continue;

    const info = parser.parse(r.title);

    // TODO: split film / OVA / anime logic
    const episodeNumber = anime.plan.type === '电影'
      ? 1
      : anime.resolveEpisode(info?.episode.number);
    if (info && episodeNumber !== undefined) {
      if (info.episode.numberAlt === undefined) {
        // Only handle Single episode
        const fansub = r.fansub?.name ?? info.release.group ?? 'fansub';
        if (anime.plan.fansub.includes(fansub)) {
          map
            .getOrPut(episodeNumber, () => new MutableMap([]))
            .getOrPut(fansub, () => [])
            .push(r);
        }
      }
    } else {
      logger.info(`${lightYellow('Parse Error')}  ${r.title}`);
    }
  }

  const fansubIds = new MutableMap(anime.plan.fansub.map((f, idx) => [f, idx]));
  const ordered = new MutableMap(
    map
      .entries()
      .filter(([_ep, map]) => map.size > 0)
      .map(([ep, map]) => {
        const fansubs = map.entries().toArray();
        fansubs.sort((lhs, rhs) => {
          const fl = fansubIds.getOrDefault(lhs[0], 9999);
          const fr = fansubIds.getOrDefault(rhs[0], 9999);
          return fl - fr;
        });

        return [
          ep,
          { fansub: fansubs[0][0], resources: fansubs[0][1] }
        ] as const;
      })
      .toArray()
  );

  return ordered;
}

export async function runDownloadTask(
  system: AnimeSystem,
  anime: Anime,
  videos: Task[],
  client: DownloadClient
) {
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
        text += ` | ${Number(payload.completed)} B / ${
          Number(
            payload.total
          )
        } B`;
      } else {
        text += `${formatSize(Number(payload.completed))} / ${
          formatSize(
            Number(payload.total)
          )
        }`;
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
  const cancelRefresh = loop(async () => {
    if (anime.dirty()) {
      await anime.writeLibrary();
      systemLogger.info(
        lightGreen(
          `The library file of ${anime.plan.title} has been written back`
        )
      );
    }
  }, 10 * 60 * 1000); // 10 minutes

  const tasks = videos.map(async video => {
    const bar = multibar.create(video.video.filename, 100);
    try {
      const { files } = await client.download(
        video.video.filename,
        video.resource.magnet,
        {
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
            const value = payload.total > 0
              ? +(Math.ceil((1000.0 * completed) / total) / 10).toFixed(1)
              : 0;
            bar.update(value, { ...payload, state: '' });
          },
          onComplete() {
            bar.update(100);
          }
        }
      );
      bar.update(100);
      bar.remove();

      multibarLogger.info(
        `${lightGreen('Download')} ${bold(video.video.filename)} ${
          lightGreen(
            'OK'
          )
        }`
      );

      if (files.length === 1) {
        const file = files[0];
        // Hack: update filename extension
        video.video.filename = anime.formatFilename({
          fansub: video.video.fansub,
          episode: video.video.episode,
          extension: path.extname(file).slice(1) || 'mp4'
        });

        // Remove old animegarden video to keep storage clean
        {
          // Resolve episode number
          const resolvedEpisode = anime.resolveEpisode(video.video.episode);
          const library = (await anime.library()).videos;
          const oldVideo = library.find(
            v =>
              v.source.type === ANIMEGARDEN
              && anime.resolveEpisode(v.episode) === resolvedEpisode // Find same episode after being resolved
          );
          if (oldVideo) {
            multibarLogger.info(
              `${lightRed('Removing')} ${bold(oldVideo.filename)}`
            );
            await anime.removeVideo(oldVideo);
          }
        }

        // Copy video to storage
        await anime.addVideoByCopy(file, video.video);

        multibarLogger.info(
          `${lightGreen('Copy')} ${bold(video.video.filename)} ${
            lightGreen(
              'OK'
            )
          }`
        );
      } else {
        multibar.println(
          `${lightYellow(`Warn`)} Resource ${
            link(
              video.resource.title,
              video.resource.href
            )
          } has multiple files`
        );
      }
    } catch (error) {
      const defaultMessage = `Download ${
        link(
          video.resource.title,
          video.resource.href
        )
      } failed`;
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
    await anime.sortVideos();
  } catch (error) {
    multibar.finish();
    systemLogger.info(
      lightRed(`Failed to downloading resources of ${bold(anime.plan.title)}`)
    );
    systemLogger.error(error);
  } finally {
    await anime.writeLibrary();
    systemLogger.info(
      lightGreen(
        `The library file of ${anime.plan.title} has been written back`
      )
    );
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
