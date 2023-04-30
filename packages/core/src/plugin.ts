import type { Breadc } from 'breadc';

import type { AnimeSpace } from './space/types';

export interface Plugin {
  name: string;

  prepare?: (space: AnimeSpace) => Promise<void>;

  command?: (space: AnimeSpace, cli: Breadc<{}>) => Promise<void>;

  introspect?: (space: AnimeSpace, anime: string) => Promise<void>;

  refresh?: (space: AnimeSpace, anime: string) => Promise<void>;
}
