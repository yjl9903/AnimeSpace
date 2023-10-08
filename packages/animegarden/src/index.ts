import { z } from 'zod';
import { memo } from 'memofunc';

import {
  type AnimeSystem,
  onDeath,
  type Plugin,
  type PluginEntry,
  StringArray
} from '@animespace/core';
import { bold, dim, lightBlue, lightCyan, lightRed, link } from '@breadc/color';

import './plan.d';

import { registerCli } from './cli';
import { ANIMEGARDEN, DOT } from './constant';
import { DownloadProviders, makeClient } from './download';
import { generateDownloadTask, runDownloadTask } from './task';
import { fetchAnimeResources, useResourcesCache } from './resources';
import {
  formatAnimeGardenSearchURL,
  printFansubs,
  printKeywords
} from './format';

export interface AnimeGardenOptions extends PluginEntry {
  provider?: DownloadProviders;
}

export function AnimeGarden(options: AnimeGardenOptions): Plugin {
  const provider = options.provider ?? 'webtorrent';
  const getClient = memo((system: AnimeSystem) => {
    // Memory leak here
    const client = makeClient(provider, system, options);
    onDeath(async () => {
      await client.close();
    });
    return client;
  });

  return {
    name: 'animegarden',
    options,
    schema: {
      plan: z.object({
        bgm: z.coerce.string(),
        fansub: StringArray.default([])
      })
    },
    command(system, cli) {
      registerCli(system, cli, getClient);
    },
    introspect: {
      async handleUnknownVideo(system, anime, video) {
        if (video.source.type === ANIMEGARDEN) {
          const magnet = video.source.magnet;
        }
        return undefined;
      }
    },
    refresh: {
      async prepare(system, options) {
        const cache = await useResourcesCache(system);
        if (options.filter !== undefined) {
          cache.disable();
        }
      },
      async finish(system) {
        const cache = await useResourcesCache(system);
        cache.finalize();
        useResourcesCache.clear();
      },
      async refresh(system, anime) {
        const logger = system.logger.withTag('animegarden');
        logger.log('');

        logger.log(
          `${lightBlue('Fetching resources')} ${
            bold(
              anime.plan.title
            )
          }  (${
            link(
              `Bangumi: ${anime.plan.bgm}`,
              `https://bangumi.tv/subject/${anime.plan.bgm}`
            )
          })`
        );
        printKeywords(anime, logger);
        printFansubs(anime, logger);

        const animegardenURL = formatAnimeGardenSearchURL(anime);
        const resources = await fetchAnimeResources(system, anime).catch(
          () => undefined
        );
        if (resources === undefined) {
          logger.log(
            `${lightRed('Found resources')} ${dim('from')} ${
              link(
                'AnimeGarden',
                animegardenURL
              )
            } ${lightRed('failed')}`
          );
          return;
        }

        const newVideos = await generateDownloadTask(system, anime, resources);

        const oldVideos = (await anime.library()).videos.filter(
          v => v.source.type === ANIMEGARDEN
        );
        logger.log(
          `${dim('There are')} ${
            lightCyan(
              oldVideos.length + ' resources'
            )
          } ${dim('downloaded from')} ${link('AnimeGarden', animegardenURL)}`
        );
        if (newVideos.length === 0) {
          return;
        }

        logger.log(
          `${lightBlue(`Downloading ${newVideos.length} resources`)} ${
            dim(
              'from'
            )
          } ${link('AnimeGarden', animegardenURL)}`
        );
        for (const { video } of newVideos) {
          const detailURL = `https://garden.onekuma.cn/resource/${
            video.source
              .magnet!.split('/')
              .at(-1)
          }`;
          logger.log(`  ${DOT} ${link(video.filename, detailURL)}`);
        }

        try {
          const client = getClient(system);
          await runDownloadTask(system, anime, newVideos, client);
        } catch (error) {
          logger.error(error);
        }
      }
    }
  };
}
