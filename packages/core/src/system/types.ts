import type { ConsolaInstance } from 'consola';

import type { Anime } from '../anime';
import type { AnimeSpace } from '../space/schema';

export interface SystemOperationOptions {
  /**
   * Filter animes to be operated
   *
   * `undefined` means operate all the onair animes
   *
   * `string` means operate all the animes which contains this substring
   *
   * otherwise, use a filter function
   */
  filter?: string | ((anime: Anime) => boolean);
}

export interface LoadOptions extends SystemOperationOptions {
  force?: boolean;
}

export interface RefreshOptions extends SystemOperationOptions {
  /**
   * Prefer not using any cache
   */
  force?: boolean;
}

export interface IntrospectOptions extends SystemOperationOptions {}

export interface AnimeSystem {
  space: AnimeSpace;

  logger: ConsolaInstance;

  printSpace(): void;

  printDelta(): void;

  /**
   * Load animes from plans or introspect result
   */
  load(options?: LoadOptions): Promise<Anime[]>;

  /**
   * Refresh the media library
   */
  refresh(options?: RefreshOptions): Promise<Anime[]>;

  /**
   * Sync with the modified anime config
   */
  introspect(options?: IntrospectOptions): Promise<Anime[]>;

  /**
   * Write back the modified anime library
   */
  writeBack(): Promise<Anime[]>;

  /**
   * Sync return any library is changed
   */
  isChanged(): boolean;
}
