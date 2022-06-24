import type { RouterScrollBehavior } from 'vue-router';

import { ViteSSG } from 'vite-ssg';
import { createPinia } from 'pinia';
import routes from '~pages';

import NProgress from 'nprogress';

import 'uno.css';
import '@unocss/reset/tailwind.css';
import './styles/main.css';

import App from './App.vue';

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (savedPosition) {
    return savedPosition;
  } else {
    return { top: 0 };
  }
};

export const createApp = ViteSSG(
  App,
  { routes, scrollBehavior, base: import.meta.env.BASE_URL },
  async ({ app, router, isClient, initialState }) => {
    const pinia = createPinia();
    app.use(pinia);

    if (import.meta.env.SSR) {
      initialState.pinia = pinia.state.value;
    } else {
      pinia.state.value = initialState?.pinia || {};
    }

    if (isClient) {
      router.beforeEach((to) => {
        NProgress.start();
        const { token } = useClient();
        if (to.name !== 'Login' && token === '') {
          return { name: 'Login' };
        }
      });
      router.afterEach(() => {
        NProgress.done();
      });
    }
  }
);
