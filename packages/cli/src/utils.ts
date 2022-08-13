import { ImmutableMap, MutableMap } from 'lbear';

import type { Anime, Episode } from './anime';

export function formatEP(ep: number, fill = '0') {
  return `${ep < 10 ? fill : ''}${ep}`;
}

export function formatEpisodeName(
  format: string | undefined,
  anime: Anime,
  ep: Episode
) {
  if (!format) format = '[{fansub}] {title} - {ep}.mp4';
  return format
    .replace('{fansub}', ep.fansub)
    .replace('{title}', anime.title)
    .replace('{ep}', formatEP(ep.ep, '0'));
}

export function filterDef<T>(items: (T | undefined | null)[]): T[] {
  return items.filter(Boolean) as T[];
}

export function groupBy<T>(
  items: T[],
  fn: (arg: T) => string
): ImmutableMap<string, T[]> {
  const map = MutableMap.empty<string, T[]>();
  for (const item of items) {
    const key = fn(item);
    map.getOrPut(key, () => []).push(item);
  }
  return map.toImmutable();
}
