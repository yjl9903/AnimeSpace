/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import 'vue-router';
import type { DefineComponent } from 'vue';
import type { Item } from 'bangumi-data';

declare module '*.vue' {
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
  }
}

declare module '~bangumi/data' {
  export const bangumiItems: Item[];
}

declare module '~build/meta' {
  export const PUBLIC: boolean;
}
