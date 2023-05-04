import {
  type Plugin,
  type PluginEntry,
  formatStringArray
} from '@animespace/core';
import { fetchResources } from 'animegarden';
import {
  bold,
  dim,
  lightBlue,
  lightGreen,
  link,
  underline
} from '@breadc/color';

import './plan.d';

import { DOT } from './constant';
import { ufetch } from './ufetch';
import { DownloadProviders } from './download';
import { generateDownloadTask } from './task';

const ANIMEGARDEN = 'AnimeGarden';

export interface AnimeGardenOptions extends PluginEntry {
  provider?: DownloadProviders;
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
        logger.log('');

        logger.info(
          `${lightBlue('Fetching resources')} of ${bold(
            anime.plan.title
          )}  (${link(
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
          retry: 10,
          count: -1,
          progress(res, { url, page }) {}
        });

        const newVideos = await generateDownloadTask(system, anime, resources);
        if (newVideos.length === 0) {
          logger.info(
            `${lightGreen('Found ' + resources.length + ' resources')} ${dim(
              'from'
            )} ${link(
              'AnimeGarden',
              `https://garden.onekuma.cn/resources/1?include=${encodeURIComponent(
                JSON.stringify(anime.plan.keywords.include)
              )}&exclude=${encodeURIComponent(
                JSON.stringify(anime.plan.keywords.exclude)
              )}&after=${encodeURIComponent(anime.plan.date.toISOString())}`
            )}`
          );
          return;
        }

        const animegardenURL = `https://garden.onekuma.cn/resources/1?include=${encodeURIComponent(
          JSON.stringify(anime.plan.keywords.include)
        )}&exclude=${encodeURIComponent(
          JSON.stringify(anime.plan.keywords.exclude)
        )}&after=${encodeURIComponent(anime.plan.date.toISOString())}`;
        logger.info(
          `${lightBlue(`Downloading`)} ${lightGreen(
            newVideos.length + ' resources'
          )} ${dim('from')} ${link('AnimeGarden', animegardenURL)}`
        );
        for (const video of newVideos) {
          const detailURL = `https://garden.onekuma.cn/resource/${video.source
            .magnet!.split('/')
            .at(-1)}`;
          logger.info(`  ${DOT} ${link(video.filename, detailURL)}`);
        }

        // --- Util functions ---
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
