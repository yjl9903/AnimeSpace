/// <reference types="vite/client" />

import 'vue-router';
import type { DefineComponent } from 'vue';

declare module '*.vue' {
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
  }
}
