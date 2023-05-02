import type { AnimeSpace } from '../space/types';

import type { Anime } from './anime';

export interface AnimeSystem {
  space: AnimeSpace;

  /**
   * Load animes from plans or introspect result
   */
  animes(): Promise<Anime[]>;

  /**
   * Refresh the media library
   */
  refresh(): Promise<Anime[]>;

  /**
   * Sync with the modified anime config
   */
  introspect(): Promise<Anime[]>;

  /**
   * Write back the modified anime library
   */
  writeBack(): Promise<Anime[]>;
}
