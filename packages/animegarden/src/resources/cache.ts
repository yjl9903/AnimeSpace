import { Path } from 'breadfs';
import { memoAsync } from 'memofunc';
import { fetchResources, makeResourcesFilter, normalizeTitle, Resource } from 'animegarden';

import { Anime, AnimeSystem, ufetch } from '@animespace/core';

type ResourcesCacheSchema = Required<
  Omit<Awaited<ReturnType<typeof fetchResources>>, 'ok' | 'complete'>
>;

type AnimeCacheSchema = Required<
  Omit<Awaited<ReturnType<typeof fetchResources>>, 'ok' | 'complete'> & {
    prefer: { fansub: string[] };
  }
>;

export class ResourcesCache {
  private readonly system: AnimeSystem;

  private readonly root: Path;

  private readonly animeRoot: Path;

  private readonly resourcesRoot: Path;

  private valid: boolean = false;

  private recentResources: Resource[] = [];

  private errors: unknown[] = [];

  private recentResponse: Awaited<ReturnType<typeof fetchResources>> | undefined = undefined;

  constructor(system: AnimeSystem) {
    this.system = system;
    this.root = system.space.storage.cache.join('animegarden');
    this.animeRoot = this.root.join('anime');
    this.resourcesRoot = this.root.join('resources');
  }

  private reset() {
    this.valid = false;
    this.recentResources = [];
    this.recentResponse = undefined;
    this.errors = [];
  }

  public disable() {
    this.reset();
  }

  private async loadLatestResources(): Promise<ResourcesCacheSchema | undefined> {
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

      await this.resourcesRoot.join('latest.json').writeText(JSON.stringify(copied, null, 2));
    } catch {}
  }

  public async initialize() {
    await Promise.all([this.animeRoot.ensureDir(), this.resourcesRoot.ensureDir()]);

    const latest = await this.loadLatestResources();
    const timestamp = latest?.resources[0].createdAt
      ? new Date(latest.resources[0].createdAt)
      : undefined;

    // There is no cache found or the cache is old
    const invalid =
      timestamp === undefined ||
      new Date().getTime() - timestamp.getTime() > 7 * 24 * 60 * 60 * 1000;

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

    const oldIds = new Set(latest?.resources.map((r) => r.id) ?? []);
    this.recentResources = resp.resources.filter((r) => !oldIds.has(r.id));
    this.recentResponse = resp;
  }

  public async finalize() {
    // When there is no fetch error, store the latest response
    if (this.errors.length === 0 && this.recentResponse) {
      await this.updateLatestResources(this.recentResponse);
    }
    this.reset();
  }

  private async loadAnimeResources(anime: Anime): Promise<AnimeCacheSchema | undefined> {
    try {
      await anime.cacheDirectory.ensureDir();
      return JSON.parse(await anime.cacheDirectory.join('resources.json').readText());
    } catch {
      return undefined;
    }
  }

  private async updateAnimeResources(
    anime: Anime,
    resp: Awaited<ReturnType<typeof fetchResources>>
  ): Promise<void> {
    try {
      const copied = { ...resp, prefer: { fansub: anime.plan.fansub } };
      Reflect.deleteProperty(copied, 'ok');
      Reflect.deleteProperty(copied, 'complete');

      await anime.cacheDirectory.join('resources.json').writeText(JSON.stringify(copied, null, 2));
    } catch {}
  }

  public async clearAnimeResources(anime: Anime) {
    try {
      await anime.cacheDirectory.join('resources.json').remove();
    } catch {}
  }

  public async load(anime: Anime) {
    const cache = await this.loadAnimeResources(anime);
    if (this.valid && cache) {
      // Check whether there is any changes to the filter
      const validateFilter = (cache: AnimeCacheSchema) => {
        if (
          !cache.filter.after ||
          new Date(cache.filter.after).getTime() !== anime.plan.date.getTime()
        ) {
          return false;
        }

        const stringifyArray = (include: string[][]) => {
          return include.map((inc) => `[${inc.map(normalizeTitle).join(',')}]`).join(',');
        };
        const stringify = (keys?: string[]) => (keys ?? []).join(',');

        if (
          !cache.filter.include ||
          stringifyArray(cache.filter.include) !== stringifyArray(anime.plan.keywords.include)
        ) {
          return false;
        }

        if (stringify(cache.filter.exclude) !== stringify(anime.plan.keywords.exclude)) {
          return false;
        }

        if (stringify(cache.prefer.fansub) !== stringify(anime.plan.fansub)) {
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
      const relatedRes = this.recentResources.filter(filter);
      if (validateFilter(cache) && relatedRes.length === 0) {
        // There is no change
        return cache.resources;
      }
    }

    try {
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
    } catch (error) {
      // Record fetch error happened
      this.errors.push(error);
      throw error;
    }
  }
}

export async function clearAnimeResourcesCache(system: AnimeSystem, anime: Anime) {
  const cache = new ResourcesCache(system);
  await cache.clearAnimeResources(anime);
}

export const useResourcesCache = memoAsync(async (system: AnimeSystem) => {
  const cache = new ResourcesCache(system);
  await cache.initialize();
  return cache;
});
