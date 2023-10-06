import { Path } from 'breadfs';
import { memoAsync } from 'memofunc';

import { Anime, AnimeSystem } from '@animespace/core';

export class ResourcesCache {
  private readonly system: AnimeSystem;

  private readonly root: Path;

  private readonly animeRoot: Path;

  private readonly resourcesRoot: Path;

  constructor(system: AnimeSystem) {
    this.system = system;
    this.root = system.space.storage.cache.directory.join('animegarden');
    this.animeRoot = this.root.join('anime');
    this.resourcesRoot = this.root.join('resources');
  }

  public async initialize() {}

  public async load(anime: Anime) {}
}

export const useResourcesCache = memoAsync(async (system: AnimeSystem) => {
  const cache = new ResourcesCache(system);
  await cache.initialize();
  return cache;
});
