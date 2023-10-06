import type { Breadc } from 'breadc';

import { bold, lightYellow, link } from '@breadc/color';
import { type AnimeSystem, loadAnime } from '@animespace/core';

import './plan.d';

import { ANIMEGARDEN, DOT } from './constant';
import { generateDownloadTask } from './task';
import {
  formatAnimeGardenSearchURL,
  printFansubs,
  printKeywords,
} from './format';
import { DownloadClient } from './download';
import { fetchAnimeResources } from './resources';

export function registerCli(
  system: AnimeSystem,
  cli: Breadc<{}>,
  getClient: (system: AnimeSystem) => DownloadClient
) {
  const logger = system.logger.withTag('animegarden');

  cli
    .command('garden list [keyword]', 'List videos of anime from AnimeGarden')
    .option('--onair', 'Only display onair animes')
    .action(async (keyword, options) => {
      const animes = await filterAnimes(keyword, options);

      for (const anime of animes) {
        const animegardenURL = formatAnimeGardenSearchURL(anime);
        logger.log(
          `${bold(anime.plan.title)}  (${link(
            `Bangumi: ${anime.plan.bgm}`,
            `https://bangumi.tv/subject/${anime.plan.bgm}`
          )}, ${link('AnimeGarden', animegardenURL)})`
        );
        printKeywords(anime, logger);
        printFansubs(anime, logger);

        const resources = await fetchAnimeResources(system, anime);
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
          if (!lib.videos.find(v => v.source.magnet === video.source.magnet!)) {
            const aliasVideo = lib.videos.find(
              v => v.source.type !== ANIMEGARDEN && v.episode === video.episode
            );
            if (aliasVideo) {
              extra = `overwritten by ${bold(aliasVideo.filename)}`;
            } else {
              extra = lightYellow('Not yet downloaded');
            }
          }

          logger.log(
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
      const exts = extensions.map(e => (e.startsWith('.') ? e : '.' + e));
      await client.clean(exts);
    });

  // --- Util functions ---
  async function filterAnimes(
    keyword: string | undefined,
    options: { onair: boolean }
  ) {
    return (
      await loadAnime(system, a =>
        options.onair ? a.plan.status === 'onair' : true
      )
    ).filter(
      a =>
        !keyword ||
        a.plan.title.includes(keyword) ||
        Object.values(a.plan.translations)
          .flat()
          .some(t => t.includes(keyword))
    );
  }
}
