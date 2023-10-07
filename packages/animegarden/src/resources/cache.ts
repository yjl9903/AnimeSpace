import { Path } from 'breadfs';
import { memoAsync } from 'memofunc';
import { fetchResources, makeResourcesFilter, Resource } from 'animegarden';

import { Anime, AnimeSystem, ufetch } from '@animespace/core';

type ResourcesCacheScehma = Required<
  Omit<Awaited<ReturnType<typeof fetchResources>>, 'ok' | 'complete'>
>;

export class ResourcesCache {
  private readonly system: AnimeSystem;

  private readonly root: Path;

  private readonly animeRoot: Path;

  private readonly resourcesRoot: Path;

  private valid: boolean = false;

  private recentResources: Resource[] = [];

  private recentResponse:
    | Awaited<ReturnType<typeof fetchResources>>
    | undefined = undefined;

  constructor(system: AnimeSystem) {
    this.system = system;
    this.root = system.space.storage.cache.directory.join('animegarden');
    this.animeRoot = this.root.join('anime');
    this.resourcesRoot = this.root.join('resources');
  }

  public disable() {
    this.valid = false;
    this.recentResources = [];
    this.recentResponse = undefined;
  }

  private async loadLatestResources(): Promise<
    ResourcesCacheScehma | undefined
  > {
    try {
      const content = await this.resourcesRoot.join('latest.json').readText();
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }

  private async updateLatestResources(
    resp: Awaited<ReturnType<typeof fetchResources>>
  ): Promise<void> {
    try {
      const copied = { ...resp };
      Reflect.deleteProperty(copied, 'ok');
      Reflect.deleteProperty(copied, 'complete');

      await this.resourcesRoot
        .join('latest.json')
        .writeText(JSON.stringify(copied, null, 2));
    } catch {}
  }

  public async initialize() {
    await Promise.all([
      this.animeRoot.ensureDir(),
      this.resourcesRoot.ensureDir()
    ]);

    const latest = await this.loadLatestResources();
    const timestamp = latest?.resources[0].createdAt
      ? new Date(latest.resources[0].createdAt)
      : undefined;

    // There is no cache found or the cache is old
    const invalid = timestamp === undefined
      || new Date().getTime() - timestamp.getTime() > 7 * 24 * 60 * 60 * 1000;

    const ac = new AbortController();
    const resp = await fetchResources(ufetch, {
      type: '動畫',
      retry: 10,
      count: -1,
      signal: ac.signal,
      progress(delta) {
        if (invalid) {
          ac.abort();
          return;
        }

        for (const item of delta) {
          if (new Date(item.createdAt).getTime() < timestamp.getTime()) {
            ac.abort();
          }
        }
      }
    });

    this.valid = !invalid || !resp.filter || !resp.timestamp;

    const oldIds = new Set(latest?.resources.map(r => r.id) ?? []);
    this.recentResources = resp.resources.filter(r => !oldIds.has(r.id));
    this.recentResponse = resp;
  }

  public async finalize() {
    if (this.recentResponse) {
      // await this.updateLatestResources(this.recentResponse);
    }
    this.disable();
  }

  private async loadAnimeResources(
    anime: Anime
  ): Promise<ResourcesCacheScehma | undefined> {
    try {
      const root = this.animeRoot.join(anime.relativeDirectory);
      await root.ensureDir();
      return JSON.parse(await root.join('resources.json').readText());
    } catch {
      return undefined;
    }
  }

  private async updateAnimeResources(
    anime: Anime,
    resp: Awaited<ReturnType<typeof fetchResources>>
  ): Promise<void> {
    try {
      const root = this.animeRoot.join(anime.relativeDirectory);

      const copied = { ...resp };
      Reflect.deleteProperty(copied, 'ok');
      Reflect.deleteProperty(copied, 'complete');

      await root
        .join('resources.json')
        .writeText(JSON.stringify(copied, null, 2));
    } catch {}
  }

  public async load(anime: Anime) {
    const cache = await this.loadAnimeResources(anime);
    if (this.valid && cache) {
      // Check whether there is any changes to the filter
      const validateFilter = (cache: ResourcesCacheScehma) => {
        if (
          !cache.filter.after
          || new Date(cache.filter.after).getTime()
            !== anime.plan.date.getTime()
        ) {
          return false;
        }

        const stringify = (include: string[][]) => {
          return include.map(inc => `[${inc.join(',')}]`).join(',');
        };
        if (
          !cache.filter.include
          || stringify(cache.filter.include)
            !== stringify(anime.plan.keywords.include)
        ) {
          return false;
        }

        if (
          (cache.filter.exclude ?? []).join(',')
            !== anime.plan.keywords.exclude.join(',')
        ) {
          return false;
        }

        return true;
      };

      const filter = makeResourcesFilter({
        type: '動畫',
        after: anime.plan.date,
        include: anime.plan.keywords.include,
        exclude: anime.plan.keywords.exclude
      });
      if (
        validateFilter(cache)
        && this.recentResources.filter(filter).length === 0
      ) {
        // There is no change
        return cache.resources;
      }
    }

    const ac = new AbortController();
    const resp = await fetchResources(ufetch, {
      type: '動畫',
      after: anime.plan.date,
      include: anime.plan.keywords.include,
      exclude: anime.plan.keywords.exclude,
      retry: 10,
      count: -1,
      signal: ac.signal,
      progress(delta) {
        for (const item of delta) {
        }
      }
    });

    await this.updateAnimeResources(anime, resp);

    return resp.resources;
  }
}

export const useResourcesCache = memoAsync(async (system: AnimeSystem) => {
  const cache = new ResourcesCache(system);
  await cache.initialize();
  return cache;
});
