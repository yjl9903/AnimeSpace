import type { KVStore } from './utils/store';

export type UserType = 'root' | 'admin' | 'user' | 'visitor';

export interface BaseUser {
  /**
   * User access token
   */
  token: string;

  /**
   * User type
   */
  type: UserType;

  /**
   * Access logs
   * Used for restricting multiple login
   */
  access?: Access[];

  /**
   * Comment
   */
  comment?: string;
}

export interface User extends BaseUser {
  type: 'user';
}

export interface Admin extends BaseUser {
  type: 'root' | 'admin';
}

export interface Visitor extends BaseUser {
  type: 'visitor';
}

export interface Access {
  ip: string;
  count: number;
  timestamp: number;
}

/**
 * Onair anime definition
 *
 * Notice: this definition also appear at packages/cli/src/client and src/composables/client
 */
export interface OnairAnime {
  title: string;

  bgmId: string;

  episodes: OnairEpisode[];

  /**
   * Online link
   */
  link?: string;

  /**
   * Refresh timestamp
   */
  timestamp: string;
}

export interface OnairEpisode {
  /**
   * 条目内的集数, 从 1 开始
   */
  ep: number;

  /**
   * Video qulity
   */
  quality: 1080 | 720;

  /**
   * Airdate
   */
  creationTime: string;

  /**
   * Play url
   */
  playURL: string;

  /**
   * Global storage config
   */
  storage: {
    type: string;
    videoId: string;
    source: {};
  };
}

declare type APIFunction = PagesFunction<{
  ANIME: KVNamespace;
  UserStore: KVStore<User | Admin | Visitor>;
  UserSyncStore: KVStore<string>;
  AnimeStore: KVStore<Record<string, OnairAnime[]>>;
  user: User | Admin | Visitor;
  DEV: string;
  ENABLE_PUBLIC: string;
}>;
