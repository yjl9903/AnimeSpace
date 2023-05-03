import {
  type Plugin,
  type PluginEntry,
  formatStringArray
} from '@animespace/core';
import { fetchResources } from 'animegarden';
import { bold, dim, lightGreen, link, underline } from '@breadc/color';

import './plan.d';
import { ufetch } from './ufetch';
import { el } from 'date-fns/locale';

const DOT = dim('•');

const ANIMEGARDEN = 'AnimeGarden';

export interface AnimeGardenOptions extends PluginEntry {
  provider?: 'webtorrent' | 'aria2' | 'qbittorrent';
}

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
        printKeywords();

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

        function printKeywords() {
          if (anime.plan.keywords.include.length === 1) {
            const first = anime.plan.keywords.include[0];
            logger.info(
              `${dim('Include keywords')}  ${first
                .map((t) => underline(t))
                .join(dim(' | '))}`
            );
          } else {
            logger.info(dim(`Include keywords:`));
            for (const include of anime.plan.keywords.include) {
              logger.info(
                `  ${DOT} ${include.map((t) => underline(t)).join(' | ')}`
              );
            }
          }
          if (anime.plan.keywords.exclude.length > 0) {
            logger.info(
              `${dim(`Exclude keywords`)}  [ ${anime.plan.keywords.exclude
                .map((t) => underline(t))
                .join(' , ')} ]`
            );
          }
        }
      }
    }
  };
}
