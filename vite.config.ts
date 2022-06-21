import * as path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import Unocss from 'unocss/vite';
import {
  presetUno,
  presetAttributify,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';
import Icons from 'unplugin-icons/vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`
    }
  },
  plugins: [
    vue(),
    Unocss({
      presets: [presetUno(), presetAttributify()],
      transformers: [transformerDirectives(), transformerVariantGroup()]
    }),
    Icons({
      autoInstall: true
    })
  ]
});
