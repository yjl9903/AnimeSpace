import {
  defineConfig,
  presetUno,
  presetIcons,
  presetWebFonts,
  presetAttributify,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle'
      }
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:100,200,400,700,800',
        mono: 'Fira Code'
      }
    })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  shortcuts: {
    'bg-base': 'bg-op-50 bg-white dark:bg-[#1a1a1a]',
    'border-base': 'border-gray/20 dark:border-gray/15',
    'text-base': 'text-$text-light-1 dark:text-$text-dark-1',
    'icon-btn': 'op30 hover:op100'
  }
});
