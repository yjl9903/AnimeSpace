import { fetchResources } from 'animegarden';
import { Anime, ufetch } from '@animespace/core';

export async function fetchAnimeResources(anime: Anime) {
  const ac = new AbortController();

  const { resources } = await fetchResources(ufetch, {
    type: '動畫',
    after: anime.plan.date,
    include: anime.plan.keywords.include,
    exclude: anime.plan.keywords.exclude,
    retry: 10,
    count: -1,
    signal: ac.signal,
    progress(res, { url, page }) {},
  });

  return resources;
}
