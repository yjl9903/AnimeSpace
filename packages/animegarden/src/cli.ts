import type { Breadc } from 'breadc';

import { type AnimeSystem, loadAnime } from '@animespace/core';
import { link, bold, lightYellow } from '@breadc/color';

import './plan.d';

import { generatePlan } from './generate';
import { ANIMEGARDEN, DOT } from './constant';
import { generateDownloadTask } from './task';
import {
  formatAnimeGardenSearchURL,
  printFansubs,
  printKeywords
} from './format';
import { DownloadClient } from './download';
import { fetchAnimeResources } from './ufetch';

export function registerCli(
  system: AnimeSystem,
  cli: Breadc<{}>,
  getClient: (system: AnimeSystem) => DownloadClient
) {
  cli
    .command('generate', 'Generate Plan from your bangumi collections')
    .option('--username <username>', 'Bangumi username')
    .option('--create <filename>', 'Create plan file in the space directory')
    .option('--date <date>', 'Specify the onair begin date')
    .action(async (options) => {
      const bangumiPlugin = system.space.plugins.find(
        (p) => p.name === 'bangumi'
      );
      const username =
        options.username ?? (bangumiPlugin?.options?.username as string) ?? '';
      if (!username) {
        system.logger.error(
          'You should provide your bangumi username with --username <username>'
        );
      }

      return await generatePlan(system, username, options);
    });

  cli
    .command('garden list [keyword]', 'List videos of anime from AnimeGarden')
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
            !lib.videos.find((v) => v.source.magnet === video.source.magnet!)
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
}
