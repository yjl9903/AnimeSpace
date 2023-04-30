import type { Breadc } from 'breadc';

import type { AnimeSpace } from './space/types';

import type { AnimeSystem } from './system';

export interface Plugin {
  name: string;

  prepare?: (space: AnimeSpace) => Promise<void>;

  command?: (space: AnimeSystem, cli: Breadc<{}>) => Promise<void>;

  introspect?: (space: AnimeSystem, anime: string) => Promise<void>;

  refresh?: (space: AnimeSystem, anime: string) => Promise<void>;
}
