import { lightBlue, lightGreen } from '@breadc/color';

import type { AnimeSystem } from './types';

export async function refresh(system: AnimeSystem) {
  const logger = system.logger.withTag('refresh');
  logger.info(lightBlue(`Refresh Anime Space`));

  const animes = await system.animes();

  for (const plugin of system.space.plugins) {
    await plugin.refresh?.prepare?.(system);
  }

  for (const anime of animes) {
    for (const plugin of system.space.plugins) {
      await plugin.refresh?.refresh?.(system, anime);
    }
  }

  for (const plugin of system.space.plugins) {
    await plugin.refresh?.finish?.(system);
  }

  logger.info(lightGreen(`Refresh Anime Space OK`));
  return animes;
}
