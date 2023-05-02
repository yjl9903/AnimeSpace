import type { AnimeSystem } from './types';

export async function refresh(system: AnimeSystem) {
  for (const plugin of system.space.plugins) {
    await plugin.refresh?.prepare?.(system);
  }

  const animes = await system.animes();
  for (const anime of animes) {
    for (const plugin of system.space.plugins) {
      await plugin.refresh?.refresh?.(system, anime);
    }
  }

  for (const plugin of system.space.plugins) {
    await plugin.refresh?.finish?.(system);
  }
  return animes;
}
