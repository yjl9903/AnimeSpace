import {
  type Plugin,
  type PluginEntry,
  formatStringArray
} from '@animespace/core';
import { fetchResources } from 'animegarden';
import { bold, underline, lightGreen, link } from '@breadc/color';

import './plan.d';
import { ufetch } from './ufetch';

export interface AnimeGardenOptions extends PluginEntry {
  provider?: 'webtorrent' | 'aria2' | 'qbittorrent';
}

const ANIMEGARDEN = 'AnimeGarden';

export function AnimeGarden(options: AnimeGardenOptions): Plugin {
  const provider = options.provider ?? 'webtorrent';

  return {
    name: 'animegarden',
    async preparePlans(_space, plans) {
      for (const plan of plans) {
        for (const onair of plan.onair) {
          onair.fansub = formatStringArray(onair.fansub);
        }
      }
    },
    command(system, cli) {},
    introspect: {
      async handleUnknownVideo(system, anime, video) {
        if (video.source.type === ANIMEGARDEN) {
          const magnet = video.source.magnet;
        }
        return undefined;
      }
    },
    refresh: {
      async refresh(system, anime) {
        const logger = system.logger.withTag('animegarden');
        logger.info(
          `Fetching resources of ${bold(anime.plan.title)}  (${link(
            `Bangumi: ${anime.plan.bgmId}`,
            `https://bangumi.tv/subject/${anime.plan.bgmId}`
          )})`
        );

        const { resources } = await fetchResources(ufetch, {
          type: '動畫',
          after: anime.plan.date,
          search: {
            include: anime.plan.keywords.include,
            exclude: anime.plan.keywords.exclude
          },
          count: -1,
          progress(res, { url, page }) {}
        });
        logger.info(
          `Found ${lightGreen('' + resources.length)} resources from ${link(
            'AnimeGarden',
            'https://garden.onekuma.cn/'
          )}`
        );
      }
    }
  };
}
