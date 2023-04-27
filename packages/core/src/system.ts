import { AnimeSpace } from './space';

export interface AnimeSystem {
  space: AnimeSpace;

  /**
   * Run an indexing
   */
  index(): Promise<void>;

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
    async index() {},
    async refresh() {},
    async introspect() {}
  };
  return system;
}
