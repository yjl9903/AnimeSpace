import type { Resource } from 'animegarden';
import type { AnimeSystem, Anime } from '@animespace/core';

import path from 'node:path';
import { Parser } from 'anitomy';
import { MutableMap } from '@onekuma/map';
import { LocalVideo } from '@animespace/core';
import { cyan, lightRed, lightYellow, link } from '@breadc/color';

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
  const ordered = groupResources(system, anime, resources);
  const videos: Task[] = [];

  for (const [ep, { fansub, resources }] of ordered) {
    resources.sort((lhs, rhs) => {
      const tl = lhs.title;
      const tr = rhs.title;

      for (const [_, order] of Object.entries(
        system.space.preference.keyword.order
      )) {
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
    if (
      force ||
      !(await anime.library()).videos.find((r) => r.source.magnet === res.href)
    ) {
      videos.push({
        video: {
          filename: anime.formatFilename({
            fansub,
            episode: ep,
            extension: parser.parse(res.title)!.file.extension
          }),
          fansub: fansub,
          episode: ep,
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
    const ban = system.space.preference.keyword.exclude.some(
      (k) => r.title.indexOf(k) !== -1
    );
    if (ban) continue;
    if (r.fansub && !anime.plan.fansub.includes(r.fansub.name)) continue;

    const info = parser.parse(r.title);
    if (info && info.episode.number !== undefined) {
      const fansub = r.fansub?.name ?? info.release.group ?? 'fansub';
      if (anime.plan.fansub.includes(fansub)) {
        map
          .getOrPut(info.episode.number, () => new MutableMap([]))
          .getOrPut(fansub, () => [])
          .push(r);
      }
    } else {
      logger.warn(`${lightYellow('Parse Error')}  ${r.title}`);
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
      const formatSize = (size: number) =>
        (size / 1024 / 1024).toFixed(1) + ' MB';

      let text = '';
      if (payload.state) {
        text += payload.state;
      } else {
        text += `${formatSize(Number(payload.completed))} / ${formatSize(
          Number(payload.total)
        )}`;
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

  const tasks = videos.map(async (video) => {
    const bar = multibar.create(video.video.filename, 100);
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
          const value =
            payload.total > 0
              ? +(Math.ceil((1000.0 * completed) / total) / 10).toFixed(1)
              : 0;
          bar.update(value, { ...payload, state: '' });
        },
        onComplete() {
          bar.stop();
        }
      }
    );

    if (files.length === 1) {
      const file = files[0];
      // Hack: update filename extension
      video.video.filename = anime.formatFilename({
        fansub: video.video.fansub,
        episode: video.video.episode,
        extension: path.extname(file).slice(1) || 'mp4'
      });
      await anime.addVideo(file, video.video, { copy: true });
      multibar.println(`${cyan(`Info`)} Download ${video.video.filename} OK`);
    } else {
      multibar.println(
        `${lightYellow(`Warn`)} Resource ${link(
          video.resource.title,
          video.resource.href
        )} has multiple files`
      );
    }
  });

  await Promise.all(tasks);
  multibar.finish();

  await anime.writeLibrary();
}
