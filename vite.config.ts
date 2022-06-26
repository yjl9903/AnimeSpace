import * as path from 'path';

import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

import Unocss from 'unocss/vite';
import Icons from 'unplugin-icons/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

import Pages from 'vite-plugin-pages';
import Inspect from 'vite-plugin-inspect';
import BuildInfo from 'vite-plugin-info';

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
