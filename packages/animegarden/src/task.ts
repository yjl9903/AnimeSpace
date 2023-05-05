import type { Resource } from 'animegarden';
import type { AnimeSystem, Anime } from '@animespace/core';

import { MutableMap } from '@onekuma/map';
import { parse } from 'anitomy';

import { LocalVideo } from '@animespace/core';
import { lightYellow } from '@breadc/color';

import { DownloadClient } from './download';

export async function generateDownloadTask(
  system: AnimeSystem,
  anime: Anime,
  resources: Resource[],
  force = false
) {
  const ordered = groupResources(system, anime, resources);
  const videos: LocalVideo[] = [];
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
        filename: anime.formatFilename({
          fansub,
          episode: ep,
          extension: parse(res.title)!.file.extension
        }),
        fansub: fansub,
        episode: ep,
        source: {
          type: 'AnimeGarden',
          magnet: res.href
        }
      });
    }
  }

  videos.sort((lhs, rhs) => lhs.episode! - rhs.episode!);

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

    const info = parse(r.title);
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
  videos: LocalVideo[],
  client: DownloadClient
) {}
