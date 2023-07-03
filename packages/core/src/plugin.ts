import type { Breadc } from 'breadc';
import type { AnyZodObject } from 'zod';

import type { AnimeSystem } from './system';
import type { Anime, LocalFile, LocalVideo } from './anime';
import type { AnimeSpace, Plan, PluginEntry } from './space/schema';

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
    prepare?: (system: AnimeSystem) => MayPromise<void>;

    handleUnknownFile?: (
      system: AnimeSystem,
      anime: Anime,
      file: LocalFile
    ) => MayPromise<LocalVideo | undefined>;

    handleUnknownVideo?: (
      system: AnimeSystem,
      anime: Anime,
      video: LocalVideo
    ) => MayPromise<LocalVideo | undefined>;

    finish?: (system: AnimeSystem) => MayPromise<void>;
  };

  refresh?: {
    prepare?: (system: AnimeSystem) => MayPromise<void>;

    refresh?: (system: AnimeSystem, anime: Anime) => MayPromise<void>;

    finish?: (system: AnimeSystem) => MayPromise<void>;
  };
}
