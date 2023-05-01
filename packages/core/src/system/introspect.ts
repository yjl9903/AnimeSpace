import type { AnimeSystem } from './types';

export async function introspect(system: AnimeSystem) {
  for (const plugin of system.space.plugins) {
    await plugin.introspect?.prepare?.(system);
  }

  for (const plugin of system.space.plugins) {
    await plugin.introspect?.finish?.(system);
  }
}
