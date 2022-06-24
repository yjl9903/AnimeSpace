import * as path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import Unocss from 'unocss/vite';
import Icons from 'unplugin-icons/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

import Pages from 'vite-plugin-pages';
import Inspect from 'vite-plugin-inspect';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`
    }
  },
  plugins: [
    vue(),
    Components(),
    AutoImport({
      imports: ['vue', 'vue/macros', '@vueuse/core', 'vue-router'],
      dirs: ['./src/composables'],
      vueTemplate: true
    }),
    Unocss(),
    Icons({
      autoInstall: true
    }),
    Pages({
      dirs: 'src/pages'
    }),
    Inspect()
  ]
});
