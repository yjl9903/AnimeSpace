import { z } from 'zod';
import { memo } from 'memofunc';
import { fetchResourceDetail } from '@animegarden/client';
import { bold, dim, lightBlue, lightCyan, lightRed, link } from '@breadc/color';

import { type AnimeSystem, type Plugin, type PluginEntry, onDeath, ufetch } from '@animespace/core';

import './plan.d';

import { registerCli } from './cli';
import { ANIMEGARDEN, DOT } from './constant';
import { DownloadProviders, makeClient } from './download';
import { generateDownloadTask, runDownloadTask } from './task';
import { formatAnimeGardenSearchURL, printFansubs, printKeywords } from './format';
import { clearAnimeResourcesCache, fetchAnimeResources, useResourcesCache } from './resources';

export interface AnimeGardenOptions extends PluginEntry {
  api?: string;

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
  const config = { baseURL: options.api };
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
            'dmhy',
            video.source.magnet.split('/').at(-1)!,
            { fetch: ufetch, baseURL: options.api }
          );

          try {
            if (
              resource &&
              resource.resource &&
              resource.detail &&
              resource.detail.magnets.length > 0
            ) {
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
                      ...resource.resource,
                      // This should have tracker
                      magnet: resource.detail?.magnets[0].url,
                      tracker: ''
                    }
                  }
                ],
                client
              );
            }
          } catch (error) {
            logger.error(error);
            // should not clear video library
            return video;
          } finally {
            return video;
          }
        }

        return undefined;
      }
    },
    refresh: {
      async pre(system, options) {
        useResourcesCache.clear();
        const cache = await useResourcesCache(system, config);
        if (options.filter !== undefined) {
          cache.disable();
        }
      },
      async post(system) {
        const cache = await useResourcesCache(system, config);
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
        const resources = await fetchAnimeResources(system, anime, config).catch(() => undefined);
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
        for (const { video, resource } of newVideos) {
          const detailURL = `https://animes.garden/detail/${resource.provider}/${resource.providerId}`;
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
