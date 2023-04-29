import type { AnimeSpace } from './space';

export interface AnimeSystem {
  space: AnimeSpace;

  /**
   * Refresh the media library
   */
  refresh(): Promise<void>;

  /**
   * Sync with the modified anime config
   */
  introspect(): Promise<void>;
}

export async function createAnimeSystem(
  space: AnimeSpace
): Promise<AnimeSystem> {
  const system: AnimeSystem = {
    space,
    async refresh() {},
    async introspect() {}
  };
  return system;
}
