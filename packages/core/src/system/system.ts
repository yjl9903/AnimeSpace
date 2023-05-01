import type { AnimeSpace } from '../space';

import type { AnimeSystem } from './types';

import { introspect } from './introspect';

export async function createAnimeSystem(
  space: AnimeSpace
): Promise<AnimeSystem> {
  const system: AnimeSystem = {
    space,
    async refresh() {},
    async introspect() {
      return introspect(system);
    }
  };
  return system;
}
