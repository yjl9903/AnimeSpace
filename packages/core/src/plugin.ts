import type { Breadc } from 'breadc';

import type { AnimeSystem } from './system/types';
import type { AnimeSpace, Plan } from './space/types';

export interface Plugin {
  /**
   * The name of your plugin
   */
  name: string;

  /**
   * Prepare anime space configurations
   */
  prepare?: (space: AnimeSpace) => void | Promise<void>;

  /**
   * Prepare anime space plans
   */
  preparePlans?: (space: AnimeSpace, plans: Plan[]) => void | Promise<void>;

  /**
   * Extend command line interface
   */
  command?: (system: AnimeSystem, cli: Breadc<{}>) => void | Promise<void>;

  introspect?: {
    prepare?: (system: AnimeSystem) => void | Promise<void>;

    finish?: (system: AnimeSystem) => void | Promise<void>;
  };

  refresh?: (space: AnimeSystem, anime: string) => void | Promise<void>;
}
