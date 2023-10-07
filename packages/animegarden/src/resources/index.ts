import { Anime, AnimeSystem } from '@animespace/core';

import { useResourcesCache } from './cache';

export async function fetchAnimeResources(system: AnimeSystem, anime: Anime) {
  const cache = await useResourcesCache(system);
  return cache.load(anime);
}
