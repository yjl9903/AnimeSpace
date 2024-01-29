import { z } from 'zod';
import { memo } from 'memofunc';
import { fetchResourceDetail } from 'animegarden';
import { bold, dim, lightBlue, lightCyan, lightRed, link } from '@breadc/color';

import {
  type AnimeSystem,
  onDeath,
  type Plugin,
  type PluginEntry,
  StringArray,
  ufetch
} from '@animespace/core';

import './plan.d';

import { registerCli } from './cli';
import { ANIMEGARDEN, DOT } from './constant';
import { DownloadProviders, makeClient } from './download';
import { generateDownloadTask, runDownloadTask } from './task';
import { clearAnimeResourcesCache, fetchAnimeResources, useResourcesCache } from './resources';
import { formatAnimeGardenSearchURL, printFansubs, printKeywords } from './format';

export interface AnimeGardenOptions extends PluginEntry {
  provider?: DownloadProviders;
}

const memoClient = memo(
  (provider: DownloadProviders, system: AnimeSystem, options: any) => {
    const client = makeClient(provider, system, options);
    onDeath(async () => {
      await client.close();
    });
    return client;
  },
  {
    serialize() {
      return [];
    }
  }
);

export function AnimeGarden(options: AnimeGardenOptions): Plugin {
  const provider = options.provider ?? 'webtorrent';
  const getClient = (sys: AnimeSystem) => memoClient(provider, sys, options);

  let shouldClearCache = false;

  return {
    name: 'animegarden',
    options,
    schema: {
      plan: z.object({
        bgm: z.coerce.string()
      })
    },
    command(system, cli) {
      registerCli(system, cli, getClient);
    },
    writeLibrary: {
      async post(system, anime) {
        if (shouldClearCache) {
          clearAnimeResourcesCache(system, anime);
        }
      }
    },
    introspect: {
      async pre(system) {
        shouldClearCache = true;
      },
      async handleUnknownVideo(system, anime, video) {
        if (video.source.type === ANIMEGARDEN && video.source.magnet) {
          const logger = system.logger.withTag('animegarden');
          const client = getClient(system);

          const resource = await fetchResourceDetail(
            ufetch,
            'dmhy',
            video.source.magnet.split('/').at(-1)!
          );

          try {
            if (resource) {
              await client.start();

              logger.log(
                `${lightBlue('Downloading')} ${bold(video.filename)} ${dim('from')} ${link(
                  `AnimeGarden`,
                  video.source.magnet
                )}`
              );

              await anime.removeVideo(video);
              await runDownloadTask(
                system,
                anime,
                [
                  {
                    video,
                    resource: {
                      ...resource,
                      magnet: resource.magnet.href
                    }
                  }
                ],
                client
              );
            }
          } catch (error) {
            logger.error(error);
          } finally {
            return video;
          }
        }

        return undefined;
      }
    },
    refresh: {
      async pre(system, options) {
        const cache = await useResourcesCache(system);
        if (options.filter !== undefined) {
          cache.disable();
        }
      },
      async post(system) {
        const cache = await useResourcesCache(system);
        cache.finalize();
        useResourcesCache.clear();
      },
      async refresh(system, anime) {
        const logger = system.logger.withTag('animegarden');
        logger.log('');

        logger.log(
          `${lightBlue('Fetching resources')} ${bold(anime.plan.title)}  (${link(
            `Bangumi: ${anime.plan.bgm}`,
            `https://bangumi.tv/subject/${anime.plan.bgm}`
          )})`
        );
        printKeywords(anime, logger);
        printFansubs(anime, logger);

        const animegardenURL = formatAnimeGardenSearchURL(anime);
        const resources = await fetchAnimeResources(system, anime).catch(() => undefined);
        if (resources === undefined) {
          logger.log(
            `${lightRed('Found resources')} ${dim('from')} ${link(
              'AnimeGarden',
              animegardenURL
            )} ${lightRed('failed')}`
          );
          return;
        }

        const newVideos = await generateDownloadTask(system, anime, resources);

        const oldVideos = (await anime.library()).videos.filter(
          (v) => v.source.type === ANIMEGARDEN
        );
        logger.log(
          `${dim('There are')} ${lightCyan(oldVideos.length + ' resources')} ${dim(
            'downloaded from'
          )} ${link('AnimeGarden', animegardenURL)}`
        );
        if (newVideos.length === 0) {
          return;
        }

        logger.log(
          `${lightBlue(`Downloading ${newVideos.length} resources`)} ${dim('from')} ${link(
            'AnimeGarden',
            animegardenURL
          )}`
        );
        for (const { video } of newVideos) {
          const detailURL = `https://garden.onekuma.cn/resource/${video.source
            .magnet!.split('/')
            .at(-1)}`;
          logger.log(`  ${DOT} ${link(video.filename, detailURL)}`);
        }

        try {
          const client = getClient(system);
          client.system = system; // Ensure the system is correct

          await runDownloadTask(system, anime, newVideos, client);
        } catch (error) {
          logger.error(error);
        }
      }
    }
  };
}
