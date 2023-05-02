import type { Breadc } from 'breadc';

import type { AnimeSystem } from './system/types';
import type { AnimeSpace, Plan } from './space/types';
import type { Anime, LocalFile, LocalVideo } from './system/anime';

type MayPromise<T> = T | Promise<T>;

export interface Plugin {
  /**
   * The name of your plugin
   */
  name: string;

  /**
   * Prepare anime space configurations
   */
  prepare?: (space: AnimeSpace) => MayPromise<void>;

  /**
   * Prepare anime space plans
   */
  preparePlans?: (space: AnimeSpace, plans: Plan[]) => MayPromise<void>;

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
    prepare?: (space: AnimeSystem) => MayPromise<void>;

    refresh?: (space: AnimeSystem, anime: Anime) => MayPromise<void>;

    finish?: (space: AnimeSystem) => MayPromise<void>;
  };
}
