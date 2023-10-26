import type { Resource } from 'animegarden';

import {
  Anime,
  AnimeSystem,
  getEpisodeKey,
  hasEpisodeNumberAlt,
  isValidEpisode,
  parseEpisode
} from '@animespace/core';
import { Parser } from 'anitomy';
import { MutableMap } from '@onekuma/map';

import { lightYellow } from '@breadc/color';

import type { Task } from './types';

const parser = new Parser();

export async function generateDownloadTask(
  system: AnimeSystem,
  anime: Anime,
  resources: Resource[],
  force = false
) {
  const library = await anime.library();
  const ordered = groupResources(system, anime, resources);
  const videos: Task[] = [];

  for (const [_ep, { fansub, resources }] of ordered) {
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
    if (
      force
      || !library.videos.find(
        r => r.source.magnet?.split('/').at(-1) === res.href.split('/').at(-1)
      )
    ) {
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
            magnet: `https://garden.onekuma.cn/resource/${
              res.href
                .split('/')
                .at(-1)
            }`
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
  const map = new MutableMap<string, MutableMap<string, Resource[]>>([]);

  for (const r of resources) {
    // Resource title should not have exclude keywords
    if (
      system.space.preference.keyword.exclude.some(
        k => r.title.indexOf(k) !== -1
      )
    ) {
      continue;
    }

    const episode = parseEpisode(anime, r.title, {
      metadata: info => ({
        fansub: r.fansub?.name ?? r.publisher.name ?? info.release.group
          ?? 'fansub'
      })
    });

    if (episode && isValidEpisode(episode)) {
      // Disable multiple files like 01-12
      if (episode.type === 'TV') {
        if (!hasEpisodeNumberAlt(episode)) {
          const fansub = episode.metadata.fansub;
          if (fansub === 'fansub' || anime.plan.fansub.includes(fansub)) {
            map
              .getOrPut(getEpisodeKey(episode), () => new MutableMap([]))
              .getOrPut(fansub, () => [])
              .push(r);
          }
        }
      } else if (['电影', '特别篇'].includes(episode.type)) {
        const fansub = episode.metadata.fansub;
        if (fansub === 'fansub' || anime.plan.fansub.includes(fansub)) {
          map
            .getOrPut(getEpisodeKey(episode), () => new MutableMap([]))
            .getOrPut(fansub, () => [])
            .push(r);
        }
      }
    } else {
      logger.log(`${lightYellow('Parse Error')}  ${r.title}`);
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
