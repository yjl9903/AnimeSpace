import { lightBlue, lightGreen } from '@breadc/color';

import type { AnimeSystem, RefreshOptions } from './types';

export async function refresh(system: AnimeSystem, options: RefreshOptions) {
  const logger = system.logger.withTag('refresh');
  logger.log(lightBlue(`Refresh Anime Space`));

  const animes = await system.load(options);

  for (const plugin of system.space.plugins) {
    await plugin.refresh?.pre?.(system, options);
  }

  for (const anime of animes) {
    for (const plugin of system.space.plugins) {
      await plugin.refresh?.refresh?.(system, anime, options);
    }
  }

  for (const plugin of system.space.plugins) {
    await plugin.refresh?.post?.(system, options);
  }

  logger.log('');
  system.printDelta();
  logger.log(lightGreen(`Refresh Anime Space OK`));
  return animes;
}
