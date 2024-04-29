import { Anime, AnimeSystem } from '@animespace/core';

import { useResourcesCache } from './cache';

export { clearAnimeResourcesCache, useResourcesCache } from './cache';

export async function fetchAnimeResources(system: AnimeSystem, anime: Anime) {
  const cache = await useResourcesCache(system);
  try {
    return await cache.load(anime);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
