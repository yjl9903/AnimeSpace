import type { AnimeSpace } from '../space';

import type { Anime } from './anime';
import type { AnimeSystem } from './types';

import { refresh } from './refresh';
import { introspect, loadAnime } from './introspect';

export async function createAnimeSystem(
  space: AnimeSpace
): Promise<AnimeSystem> {
  // Cache animes
  let animes: Anime[] | undefined = undefined;

  const system: AnimeSystem = {
    space,
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
    }
  };
  return system;
}
