import { Path } from 'breadfs';
import { memoAsync } from 'memofunc';
import {
  type FetchResourcesOptions,
  type Resource,
  fetchResources,
  normalizeTitle,
  makeResourcesFilter,
} from '@animegarden/client';

import { Anime, AnimeSystem, ufetch } from '@animespace/core';

import { debug } from '../constant';

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

  private readonly options: FetchResourcesOptions;

  private readonly root: Path;

  private readonly animeRoot: Path;

  private readonly resourcesRoot: Path;

  private valid: boolean = false;

  private recentResources: Resource[] = [];

  private errors: unknown[] = [];

  private recentResponse: Awaited<ReturnType<typeof fetchResources>> | undefined = undefined;

  constructor(system: AnimeSystem, options: Pick<FetchResourcesOptions, 'baseURL'> = {}) {
    this.system = system;
    this.options = options;
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
    const timestamp = latest?.resources[0]?.createdAt
      ? new Date(latest.resources[0].createdAt)
      : undefined;

    // There is no cache found or the cache is old
    const invalid =
      timestamp === undefined ||
      new Date().getTime() - timestamp.getTime() > 7 * 24 * 60 * 60 * 1000;

    const ac = new AbortController();

    const resp = await fetchResources({
      fetch: ufetch,
      baseURL: this.options.baseURL,
      type: '动画',
      retry: 10,
      count: -1,
      signal: ac.signal,
      timeout: 60 * 1000,
      tracker: true,
      headers: {
        'Cache-Control': 'no-store'
      },
      progress(delta) {
        if (invalid) {
          ac.abort();
          return;
        }

        const newItems = delta.filter(
          (item) => new Date(item.createdAt).getTime() > timestamp.getTime()
        );
        if (newItems.length === 0) {
          ac.abort();
        }
      }
    });

    this.valid =
      resp.resources.length > 0 || !resp.ok || !invalid || !resp.filter || !resp.timestamp;

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
      const root = this.animeRoot.join(anime.relativeDirectory);
      await root.ensureDir();
      return JSON.parse(await root.join('resources.json').readText());
    } catch {
      return undefined;
    }
  }

  private async updateAnimeResources(
    anime: Anime,
    resp: Awaited<ReturnType<typeof fetchResources> & { magnet: string }>
  ): Promise<void> {
    try {
      const root = this.animeRoot.join(anime.relativeDirectory);

      const copied = { ...resp, prefer: { fansub: anime.plan.fansub } };
      Reflect.deleteProperty(copied, 'ok');
      Reflect.deleteProperty(copied, 'complete');

      await root.join('resources.json').writeText(JSON.stringify(copied, null, 2));
    } catch {}
  }

  public async clearAnimeResources(anime: Anime) {
    try {
      const root = this.animeRoot.join(anime.relativeDirectory);
      await root.join('resources.json').remove();
    } catch {}
  }

  public async load(anime: Anime) {
    const cache = await this.loadAnimeResources(anime);
    if (this.valid && cache?.filter) {
      // Check whether there is any changes to the filter
      const validateFilter = (cache: AnimeCacheSchema) => {
        if (
          !cache.filter?.after ||
          new Date(cache.filter.after).getTime() !== anime.plan.date.getTime()
        ) {
          return false;
        }

        const stringify = (keys?: string[]) =>
          (keys ?? [])
            .map((v) => normalizeTitle(v).toLowerCase())
            .sort()
            .join(',');

        if (
          !cache.filter?.include ||
          stringify(cache.filter.include) !== stringify(anime.plan.keywords.include)
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
        types: ['动画'],
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

      const resp = await fetchResources({
        fetch: ufetch,
        baseURL: this.options.baseURL,
        type: '动画',
        after: anime.plan.date,
        include: anime.plan.keywords.include,
        exclude: anime.plan.keywords.exclude,
        tracker: true,
        retry: 10,
        count: -1,
        signal: ac.signal,
        progress(delta, props) {
          // for (const item of delta) {
          // }
        }
      });

      await this.updateAnimeResources(anime, resp);

      return resp.resources;
    } catch (error) {
      debug(error);
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

export const useResourcesCache = memoAsync(
  async (system: AnimeSystem, options?: Pick<FetchResourcesOptions, 'baseURL'>) => {
    const cache = new ResourcesCache(system, options);
    await cache.initialize();
    return cache;
  }
);
