import type { KVStore } from './utils/store';

type UserType = 'root' | 'admin' | 'user';

interface BaseUser {
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

interface User extends BaseUser {
  type: 'user';
}

interface Admin extends BaseUser {
  type: 'root' | 'admin';
}

interface Access {
  ip: string;
  count: number;
  timestamp: number;
}

declare type APIFunction = PagesFunction<{
  ANIME: KVNamespace;
  UserStore: KVStore<User | Admin>;
  user: User | Admin;
  DEV: string;
}>;
