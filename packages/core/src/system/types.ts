import type { AnimeSpace } from '../space/types';

export interface AnimeSystem {
  space: AnimeSpace;

  /**
   * Refresh the media library
   */
  refresh(): Promise<void>;

  /**
   * Sync with the modified anime config
   */
  introspect(): Promise<void>;
}
