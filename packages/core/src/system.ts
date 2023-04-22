export interface AnimeSystem {
  /**
   * Run an indexing
   */
  index(): Promise<void>;

  /**
   * Refresh the media library
   */
  refresh(): Promise<void>;
}

export async function createAnimeSystem(): Promise<AnimeSystem> {
  const system: AnimeSystem = {
    async index() {},
    async refresh() {}
  };
  return system;
}
