import type { Breadc } from 'breadc';
import type { AnyZodObject } from 'zod';

import type { Anime, LocalFile, LocalVideo } from './anime';
import type { AnimeSpace, Plan, PluginEntry } from './space/schema';
import type { AnimeSystem, IntrospectOptions, RefreshOptions } from './system';

type MayPromise<T> = T | Promise<T>;

export interface Plugin {
  /**
   * The name of your plugin
   */
  name: string;

  /**
   * Options to create this plugin
   */
  options: PluginEntry;

  prepare?: {
    /**
     * Prepare anime space configurations
     */
    space?: (space: AnimeSpace) => MayPromise<void>;

    /**
     * Prepare anime space plans
     */
    plans?: (space: AnimeSpace, plans: Plan[]) => MayPromise<void>;
  };

  schema?: {
    space?: AnyZodObject;

    plan?: AnyZodObject;
  };

  /**
   * Extend command line interface
   */
  command?: (system: AnimeSystem, cli: Breadc<{}>) => MayPromise<void>;

  introspect?: {
    prepare?: (
      system: AnimeSystem,
      options: IntrospectOptions
    ) => MayPromise<void>;

    handleUnknownFile?: (
      system: AnimeSystem,
      anime: Anime,
      file: LocalFile,
      options: IntrospectOptions
    ) => MayPromise<LocalVideo | undefined>;

    handleUnknownVideo?: (
      system: AnimeSystem,
      anime: Anime,
      video: LocalVideo,
      options: IntrospectOptions
    ) => MayPromise<LocalVideo | undefined>;

    finish?: (
      system: AnimeSystem,
      options: IntrospectOptions
    ) => MayPromise<void>;
  };

  refresh?: {
    prepare?: (
      system: AnimeSystem,
      options: RefreshOptions
    ) => MayPromise<void>;

    refresh?: (
      system: AnimeSystem,
      anime: Anime,
      options: RefreshOptions
    ) => MayPromise<void>;

    finish?: (system: AnimeSystem, options: RefreshOptions) => MayPromise<void>;
  };
}
