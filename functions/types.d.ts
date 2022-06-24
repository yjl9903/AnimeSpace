import type { KVStore } from './utils/store';

export type UserType = 'root' | 'admin' | 'user';

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

export interface Access {
  ip: string;
  count: number;
  timestamp: number;
}

export interface OnairAnime {
  name: string;

  bgmId: string;

  episodes: OnairEpisode[];

  /**
   * Upload by an admin or root user
   */
  uploadBy: string;
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
}

declare type APIFunction = PagesFunction<{
  ANIME: KVNamespace;
  UserStore: KVStore<User | Admin>;
  AnimeStore: KVStore<Record<string, OnairAnime[]>>;
  user: User | Admin;
  DEV: string;
}>;
