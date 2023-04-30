import type { Breadc } from 'breadc';

import type { AnimeSystem } from './system';
import type { AnimeSpace, Plan } from './space/types';

export interface Plugin {
  /**
   * The name of your plugin
   */
  name: string;

  /**
   * Prepare anime space configurations
   */
  prepare?: (space: AnimeSpace) => Promise<void>;

  /**
   * Prepare anime space plans
   */
  preparePlans?: (space: AnimeSpace, plans: Plan[]) => Promise<void>;

  /**
   * Extend command line interface
   */
  command?: (space: AnimeSystem, cli: Breadc<{}>) => Promise<void>;

  introspect?: (space: AnimeSystem, anime: string) => Promise<void>;

  refresh?: (space: AnimeSystem, anime: string) => Promise<void>;
}
