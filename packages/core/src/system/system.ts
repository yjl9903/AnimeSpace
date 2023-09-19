import { createConsola } from 'consola';
import { dim, lightCyan, lightGreen, lightRed } from '@breadc/color';

import type { Anime } from '../anime';
import type { AnimeSpace } from '../space';

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
      logger.info(`${dim('Storage')}  ${space.storage.anime.directory}`);
      if (space.storage.library.mode === 'external') {
        logger.info(`${dim('Library')}  ${space.storage.library.directory}`);
      }
      logger.log('');
    },
    printDelta() {
      if (!animes) return;

      const delta = animes.flatMap(anime => anime.delta());
      if (delta.length > 0) {
        const DOT = dim('•');
        logger.info(
          `${dim('There are')} ${lightCyan(delta.length + ' changes')} ${
            dim('applied to the space')
          }`
        );
        for (const d of delta) {
          const format = {
            copy: lightGreen('Copy'),
            move: lightGreen('Move'),
            remove: lightRed('Remove')
          };
          const op = format[d.operation];
          logger.info(`  ${DOT} ${op} ${d.log ?? d.video.filename}`);
        }
        logger.log('');
      } else {
        logger.info(lightGreen(`Every anime is latest`));
      }
    },
    async load(options = {}) {
      if (!options.force && animes !== undefined) {
        return animes;
      } else if (!options?.filter) {
        return (animes = await loadAnime(system));
      } else {
        const filter = options.filter;
        if (typeof filter === 'string') {
          return (animes = await loadAnime(
            system,
            a => a.plan.title.includes(filter)
          ));
        } else {
          return (animes = await loadAnime(system, filter));
        }
      }
    },
    async refresh(options = {}) {
      logger.wrapConsole();
      const animes = await refresh(system, options);
      logger.restoreConsole();
      return animes;
    },
    async introspect(options = {}) {
      logger.wrapConsole();
      const animes = await introspect(system, options);
      logger.restoreConsole();
      return animes;
    },
    async writeBack() {
      logger.wrapConsole();
      const animes = await system.load();
      await Promise.all(animes.map(a => a.writeLibrary()));
      logger.restoreConsole();
      return animes;
    },
    isChanged() {
      if (animes) {
        return animes.some(a => a.dirty());
      } else {
        return false;
      }
    }
  };
  return system;
}
