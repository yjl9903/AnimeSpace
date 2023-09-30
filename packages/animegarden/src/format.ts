import type { ConsolaInstance } from 'consola';

import { Anime } from '@animespace/core';
import { dim, link, underline } from '@breadc/color';

import { DOT } from './constant';

export function formatAnimeGardenSearchURL(anime: Anime) {
  return `https://garden.onekuma.cn/resources/1?include=${
    encodeURIComponent(
      JSON.stringify(anime.plan.keywords.include)
    )
  }&exclude=${
    encodeURIComponent(
      JSON.stringify(anime.plan.keywords.exclude)
    )
  }&after=${encodeURIComponent(anime.plan.date.toISOString())}`;
}

export function printKeywords(anime: Anime, logger: ConsolaInstance) {
  if (anime.plan.keywords.include.length === 1) {
    const first = anime.plan.keywords.include[0];
    const sum = first.reduce((acc, t) => acc + t.length, 0);
    if (sum > 50) {
      logger.log(dim('Include keywords | ') + underline(first[0]));
      for (const t of first.slice(1)) {
        logger.log(`                 ${dim('|')} ${underline(t)}`);
      }
    } else {
      logger.log(
        `${dim('Include keywords')}   ${
          first
            .map((t) => underline(t))
            .join(dim(' | '))
        }`
      );
    }
  } else {
    logger.log(dim(`Include keywords:`));
    for (const include of anime.plan.keywords.include) {
      logger.log(`  ${DOT} ${include.map((t) => underline(t)).join(' | ')}`);
    }
  }
  if (anime.plan.keywords.exclude.length > 0) {
    logger.log(
      `${dim(`Exclude keywords`)}   [ ${
        anime.plan.keywords.exclude
          .map((t) => underline(t))
          .join(' , ')
      } ]`
    );
  }
}

export function printFansubs(anime: Anime, logger: ConsolaInstance) {
  const fansubs = anime.plan.fansub;
  logger.log(
    `${dim('Prefer fansubs')}     ${
      fansubs.length === 0
        ? `See ${
          link(
            'AnimeGarden',
            formatAnimeGardenSearchURL(anime)
          )
        } to select some fansubs`
        : fansubs.join(dim(' > '))
    }`
  );
}
