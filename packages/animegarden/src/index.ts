import type { ConsolaInstance } from 'consola';

import { z } from 'zod';
import { fetchResources } from 'animegarden';
import {
  type Anime,
  type Plugin,
  type PluginEntry,
  type AnimeSystem,
  onDeath,
  loadAnime,
  StringArray
} from '@animespace/core';
import {
  dim,
  link,
  bold,
  underline,
  lightRed,
  lightBlue,
  lightCyan,
  lightGreen,
  lightYellow
} from '@breadc/color';

import './plan.d';

import { ufetch } from './ufetch';
import { generatePlan } from './generate';
import { ANIMEGARDEN, DOT } from './constant';
import { DownloadProviders, makeClient } from './download';
import { generateDownloadTask, runDownloadTask } from './task';

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
      cli
        .command('generate', 'Generate Plan from your bangumi collections')
        .option('--username <username>', 'Bangumi username')
        .option(
          '--create <filename>',
          'Create plan file in the space directory'
        )
        .option('--date <date>', 'Specify the onair begin date')
        .action(async (options) => {
          const bangumiPlugin = system.space.plugins.find(
            (p) => p.name === 'bangumi'
          );
          const username =
            options.username ??
            (bangumiPlugin?.options?.username as string) ??
            '';
          if (!username) {
            system.logger.error(
              'You should provide your bangumi username with --username <username>'
            );
          }

          return await generatePlan(system, username, options);
        });

      cli
        .command(
          'garden list [keyword]',
          'List videos of anime from AnimeGarden'
        )
        .action(async (keyword) => {
          const logger = system.logger.withTag('animegarden');
          const animes = await filterAnimes(keyword);

          for (const anime of animes) {
            const animegardenURL = formatAnimeGardenSearchURL(anime);
            logger.info(
              `${bold(anime.plan.title)}  (${link(
                `Bangumi: ${anime.plan.bgm}`,
                `https://bangumi.tv/subject/${anime.plan.bgm}`
              )}, ${link('AnimeGarden', animegardenURL)})`
            );
            printKeywords(anime, logger);
            printFansubs(anime, logger);

            const resources = await fetchAnimeResources(anime);
            const videos = await generateDownloadTask(
              system,
              anime,
              resources,
              true
            );
            const lib = await anime.library();

            for (const { video } of videos) {
              const detailURL = `https://garden.onekuma.cn/resource/${video.source
                .magnet!.split('/')
                .at(-1)}`;

              let extra = '';
              if (
                !lib.videos.find(
                  (v) => v.source.magnet === video.source.magnet!
                )
              ) {
                const aliasVideo = lib.videos.find(
                  (v) =>
                    v.source.type !== ANIMEGARDEN && v.episode === video.episode
                );
                if (aliasVideo) {
                  extra = `overwritten by ${bold(aliasVideo.filename)}`;
                } else {
                  extra = lightYellow('Not yet downloaded');
                }
              }

              logger.info(
                `  ${DOT} ${link(video.filename, detailURL)}  ${
                  extra ? `(${extra})` : ''
                }`
              );
            }
            logger.log('');
          }
        });

      cli
        .command('garden clean [...extensions]', 'Clean download cache')
        .option('-y, --yes')
        .action(async (extensions, options) => {
          const client = getClient(system);
          if (extensions.length === 0) {
            extensions.push('.mp4', '.mkv', '.aria2');
          }
          const exts = extensions.map((e) => (e.startsWith('.') ? e : '.' + e));
          await client.clean(exts);
        });

      // --- Util functions ---
      async function filterAnimes(keyword: string | undefined) {
        return (await loadAnime(system, true)).filter(
          (a) =>
            !keyword ||
            a.plan.title.includes(keyword) ||
            Object.values(a.plan.translations)
              .flat()
              .some((t) => t.includes(keyword))
        );
      }
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

async function fetchAnimeResources(anime: Anime) {
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
  return resources;
}

function formatAnimeGardenSearchURL(anime: Anime) {
  return `https://garden.onekuma.cn/resources/1?include=${encodeURIComponent(
    JSON.stringify(anime.plan.keywords.include)
  )}&exclude=${encodeURIComponent(
    JSON.stringify(anime.plan.keywords.exclude)
  )}&after=${encodeURIComponent(anime.plan.date.toISOString())}`;
}

function printKeywords(anime: Anime, logger: ConsolaInstance) {
  if (anime.plan.keywords.include.length === 1) {
    const first = anime.plan.keywords.include[0];
    const sum = first.reduce((acc, t) => acc + t.length, 0);
    if (sum > 80) {
      logger.info(dim('Include keywords | ') + underline(first[0]));
      for (const t of first.slice(1)) {
        logger.info(`                 ${dim('|')} ${underline(t)}`);
      }
    } else {
      logger.info(
        `${dim('Include keywords')}   ${first
          .map((t) => underline(t))
          .join(dim(' | '))}`
      );
    }
  } else {
    logger.info(dim(`Include keywords:`));
    for (const include of anime.plan.keywords.include) {
      logger.info(`  ${DOT} ${include.map((t) => underline(t)).join(' | ')}`);
    }
  }
  if (anime.plan.keywords.exclude.length > 0) {
    logger.info(
      `${dim(`Exclude keywords`)}   [ ${anime.plan.keywords.exclude
        .map((t) => underline(t))
        .join(' , ')} ]`
    );
  }
}

function printFansubs(anime: Anime, logger: ConsolaInstance) {
  const fansubs = anime.plan.fansub;
  logger.info(
    `${dim('Prefer fansubs')}     ${
      fansubs.length === 0
        ? `See ${link(
            'AnimeGarden',
            formatAnimeGardenSearchURL(anime)
          )} to select some fansubs`
        : fansubs.join(dim(' > '))
    }`
  );
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
