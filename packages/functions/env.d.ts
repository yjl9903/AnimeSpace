/// <reference types="@cloudflare/workers-types" />
/// <reference types="vite-plugin-cloudflare-functions/types" />

import 'vite-plugin-cloudflare-functions/worker';

import type { User, Admin, Visitor, OnairAnime } from './types';
import type { KVStore } from './utils/store';

declare module 'vite-plugin-cloudflare-functions/worker' {
  interface PagesFunctionEnv {
    ANIME: KVNamespace;
    UserStore: KVStore<User | Admin | Visitor>;
    UserSyncStore: KVStore<string>;
    AnimeStore: KVStore<Record<string, OnairAnime[]>>;
    user: User | Admin | Visitor;
    DEV: string;
    ENABLE_PUBLIC: string;
  }

  interface PagesFunctionData {}
}
