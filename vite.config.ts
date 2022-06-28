import * as path from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig, Plugin } from 'vite';

import Unocss from 'unocss/vite';
import Icons from 'unplugin-icons/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

import Pages from 'vite-plugin-pages';
import BuildInfo from 'vite-plugin-info';
import Inspect from 'vite-plugin-inspect';
import { VitePWA } from 'vite-plugin-pwa';

import { items as bgmItems } from 'bangumi-data';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`
    }
  },
  plugins: [
    vue(),
    Components({
      dts: './src/components.d.ts'
    }),
    AutoImport({
      imports: ['vue', 'vue/macros', '@vueuse/core', 'vue-router'],
      dirs: ['./src/composables'],
      vueTemplate: true,
      dts: './src/auto-imports.d.ts'
    }),
    Unocss(),
    Icons({
      autoInstall: true
    }),
    Pages({
      dirs: 'src/pages',
      exclude: ['**/components/*.vue', '**/context.ts']
    }),
    BuildInfo({
      github: 'XLorPaste/AnimePaste'
    }),
    Inspect(),
    // https://github.com/antfu/vite-plugin-pwa
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
        'apple-touch-icon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'mstile-70x70.png',
        'mstile-144x144.png',
        'mstile-150x150.png',
        'mstile-310x150.png',
        'mstile-310x310.png',
        'safari-pinned-tab.svg'
      ],
      manifest: {
        name: 'AnimePaste',
        short_name: 'AnimePaste',
        description: 'Paste your favourite anime online',
        theme_color: '#ffffff',
        dir: 'ltr',
        lang: 'zh-CN',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache bangumi pictures
          {
            urlPattern: /^https:\/\/lain\.bgm\.tv\/pic\/cover\/.*\.jpg$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bangumi-pictures',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    BangumiDate(200)
  ]
});

/**
 * Only bundle first count piece of items
 *
 * @param count static import count
 * @returns
 */
function BangumiDate(count = 100): Plugin {
  const ModuleId = '~bangumi/data';
  const StaticImportCount = count;

  return {
    name: 'bangumi-data',
    resolveId(id) {
      if (id === ModuleId) return id;
    },
    load(id) {
      if (id === ModuleId) {
        bgmItems.sort((lhs, rhs) => {
          const d1 = new Date(lhs.begin).getTime();
          const d2 = new Date(rhs.begin).getTime();
          return d2 - d1;
        });
        const staticImport = [
          `export const bangumiItems = [`,
          ...bgmItems
            .slice(0, StaticImportCount)
            .map((b) => JSON.stringify(b) + ','),
          `]`
        ];
        return staticImport.join('\n');
      }
    }
  };
}
