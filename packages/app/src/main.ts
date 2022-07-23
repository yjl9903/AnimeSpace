import type { RouterScrollBehavior } from 'vue-router';

import { ViteSSG } from 'vite-ssg';
import { createPinia } from 'pinia';
import routes from '~pages';

import NProgress from 'nprogress';
import Scrollto from 'vue-scrollto';
import { setDefaultOptions } from 'date-fns';

import 'uno.css';
import '@unocss/reset/tailwind.css';
import './styles/main.css';

import App from './App.vue';

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (to.name === 'anime-id-Play-ep' && from.name !== 'anime-id-Play-ep') {
    return { el: '#root-container' };
  } else if (to.path.startsWith('/anime/')) {
    return false;
  } else if (savedPosition) {
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
    app.use(Scrollto);

    // if (import.meta.env.SSR) {
    //   initialState.pinia = pinia.state.value;
    // } else {
    //   pinia.state.value = initialState?.pinia || {};
    // }

    const zhCN = (await import('date-fns/locale/zh-CN/index')).default;
    setDefaultOptions({ locale: zhCN });

    if (isClient) {
      router.beforeEach((to) => {
        NProgress.start();
        const { token } = useClient();
        if (to.name !== 'Login' && token === '' && !to.query.token) {
          return { name: 'Login' };
        }
      });
      router.afterEach(() => {
        NProgress.done();
      });

      // Register PWA
      // const { registerSW } = await import('virtual:pwa-register');
      // registerSW({
      //   onNeedRefresh() {},
      //   onOfflineReady() {}
      // });
    }
  }
);
