import { createConsola } from 'consola';

import type { AnimeSpace } from '../space';

import type { Anime } from './anime';
import type { AnimeSystem } from './types';

import { refresh } from './refresh';
import { introspect, loadAnime } from './introspect';

export async function createAnimeSystem(
  space: AnimeSpace
): Promise<AnimeSystem> {
  const logger = createConsola();

  // Cache animes
  let animes: Anime[] | undefined = undefined;

  const system: AnimeSystem = {
    space,
    logger,
    async animes() {
      if (animes !== undefined) {
        return animes;
      } else {
        return (animes = await loadAnime(system));
      }
    },
    async refresh() {
      return refresh(system);
    },
    async introspect() {
      // Introspect animes
      return (animes = await introspect(system));
    },
    async writeBack() {
      const animes = await system.animes();
      await Promise.all(animes.map((a) => a.writeLibrary()));
      return animes;
    }
  };
  return system;
}
