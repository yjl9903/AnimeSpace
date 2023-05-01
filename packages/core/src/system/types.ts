import type { AnimeSpace } from '../space/types';

import type { Anime } from './anime';

export interface AnimeSystem {
  space: AnimeSpace;

  /**
   * Refresh the media library
   */
  refresh(): Promise<void>;

  /**
   * Sync with the modified anime config
   */
  introspect(): Promise<Anime[]>;
}
