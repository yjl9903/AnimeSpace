import type { ConsolaInstance } from 'consola';

import width from 'string-width';

import { Anime } from '@animespace/core';
import { dim, link, underline } from '@breadc/color';

import { DOT } from './constant';

export function formatAnimeGardenSearchURL(anime: Anime) {
  return `https://animes.garden/resources/1?include=${encodeURIComponent(
    JSON.stringify(anime.plan.keywords.include)
  )}&exclude=${encodeURIComponent(
    JSON.stringify(anime.plan.keywords.exclude)
  )}&after=${encodeURIComponent(anime.plan.date.toISOString())}`;
}

export function printKeywords(anime: Anime, logger: ConsolaInstance) {
  const include = anime.plan.keywords.include;
  const sum = include.reduce((acc, t) => acc + width(t), 0);
  if (sum > 50) {
    logger.log(dim('Include keywords | ') + underline(overflowText(include[0], 50)));
    for (const t of include.slice(1)) {
      logger.log(`                 ${dim('|')} ${underline(overflowText(t, 50))}`);
    }
  } else {
    logger.log(
      `${dim('Include keywords')}   ${include
        .map((t) => underline(overflowText(t, 50)))
        .join(dim(' | '))}`
    );
  }

  if (anime.plan.keywords.exclude.length > 0) {
    logger.log(
      `${dim(`Exclude keywords`)}   [ ${anime.plan.keywords.exclude
        .map((t) => underline(t))
        .join(' , ')} ]`
    );
  }
}

export function printFansubs(anime: Anime, logger: ConsolaInstance) {
  const fansubs = anime.plan.fansub;
  logger.log(
    `${dim('Prefer fansubs')}     ${
      fansubs.length === 0
        ? `See ${link('AnimeGarden', formatAnimeGardenSearchURL(anime))} to select some fansubs`
        : fansubs.join(dim(' > '))
    }`
  );
}

function overflowText(text: string, length: number, rest = '...') {
  if (width(text) <= length) {
    return text;
  } else {
    return text.slice(0, length - rest.length) + rest;
  }
}
