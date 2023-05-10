import { z } from 'zod';

import {
  type Anime,
  type Plugin,
  type PluginEntry,
  type AnimeSystem,
  onDeath,
  StringArray
} from '@animespace/core';
import {
  dim,
  link,
  bold,
  lightRed,
  lightBlue,
  lightCyan,
  lightGreen
} from '@breadc/color';

import './plan.d';

import { registerCli } from './cli';
import { ANIMEGARDEN, DOT } from './constant';
import { fetchAnimeResources } from './ufetch';
import { DownloadProviders, makeClient } from './download';
import { generateDownloadTask, runDownloadTask } from './task';
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
  const getClient = useSingleton((system: AnimeSystem) => {
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
        fansub: StringArray
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
      async refresh(system, anime) {
        const logger = system.logger.withTag('animegarden');
        logger.log('');

        logger.info(
          `${lightBlue('Fetching resources')} ${bold(
            anime.plan.title
          )}  (${link(
            `Bangumi: ${anime.plan.bgm}`,
            `https://bangumi.tv/subject/${anime.plan.bgm}`
          )})`
        );
        printKeywords(anime, logger);
        printFansubs(anime, logger);

        const animegardenURL = formatAnimeGardenSearchURL(anime);
        const resources = await fetchAnimeResources(anime).catch(
          () => undefined
        );
        if (resources === undefined) {
          logger.info(
            `${lightRed('Found resources')} ${dim('from')} ${link(
              'AnimeGarden',
              animegardenURL
            )} ${lightRed('failed')}`
          );
          return;
        }

        const newVideos = await generateDownloadTask(system, anime, resources);

        if (newVideos.length === 0) {
          logger.info(
            `${lightCyan('Found ' + resources.length + ' resources')} ${dim(
              'from'
            )} ${link('AnimeGarden', animegardenURL)}`
          );
          return;
        }

        logger.info(
          `${lightBlue(`Downloading`)} ${lightGreen(
            newVideos.length + ' resources'
          )} ${dim('from')} ${link('AnimeGarden', animegardenURL)}`
        );
        for (const { video } of newVideos) {
          const detailURL = `https://garden.onekuma.cn/resource/${video.source
            .magnet!.split('/')
            .at(-1)}`;
          logger.info(`  ${DOT} ${link(video.filename, detailURL)}`);
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

function useSingleton<T extends unknown, F extends (...args: any[]) => T>(
  fn: F
): F {
  let flag = false;
  let cache: T | undefined = undefined;
  // @ts-ignore
  return (...args: any[]) => {
    if (flag) {
      return cache;
    } else {
      cache = fn(...args);
      flag = true;
      return cache;
    }
  };
}
