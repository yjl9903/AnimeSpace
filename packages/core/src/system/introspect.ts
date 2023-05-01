import type { Plan } from '../space';

import type { AnimeSystem } from './types';

import { Anime } from './anime';

export async function introspect(system: AnimeSystem) {
  for (const plugin of system.space.plugins) {
    await plugin.introspect?.prepare?.(system);
  }

  const animes = await loadAnime(system);
  for (const anime of animes) {
    await introspectAnime(system, anime);
  }

  for (const plugin of system.space.plugins) {
    await plugin.introspect?.finish?.(system);
  }
  return animes;
}

async function introspectAnime(system: AnimeSystem, anime: Anime) {
  await anime.library();
}

export async function loadAnime(system: AnimeSystem) {
  const plans = (await system.space.plans()).filter((p) => p.state === 'onair');
  const animePlans = flatAnimePlan(plans);
  const animes = animePlans.map((ap) => new Anime(system.space, ap));
  return animes;
}

export function flatAnimePlan(plans: Plan[]) {
  return plans.flatMap((p) => p.onair);
}
