import { dim } from '@breadc/color';
import { createConsola } from 'consola';

import type { AnimeSpace } from '../space';

import type { Anime } from './anime';
import type { AnimeSystem } from './types';

import { refresh } from './refresh';
import { introspect, loadAnime } from './introspect';

export async function createAnimeSystem(
  space: AnimeSpace
): Promise<AnimeSystem> {
  const logger = createConsola({
    formatOptions: { columns: process.stdout.getWindowSize?.()[0] }
  });

  // Cache animes
  let animes: Anime[] | undefined = undefined;

  const system: AnimeSystem = {
    space,
    logger,
    printSpace() {
      logger.info(`${dim('Space')}    ${space.root}`);
      logger.info(`${dim('Storage')}  ${space.storage}`);
      logger.log('');
    },
    async animes() {
      if (animes !== undefined) {
        return animes;
      } else {
        return (animes = await loadAnime(system));
      }
    },
    async refresh() {
      logger.wrapConsole();
      const res = await refresh(system);
      logger.restoreConsole();
      return res;
    },
    async introspect() {
      logger.wrapConsole();
      // Introspect animes
      animes = await introspect(system);
      logger.restoreConsole();
      return animes;
    },
    async writeBack() {
      logger.wrapConsole();
      const animes = await system.animes();
      await Promise.all(animes.map((a) => a.writeLibrary()));
      logger.restoreConsole();
      return animes;
    }
  };
  return system;
}
