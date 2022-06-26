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
  },
  theme: {
    boxShadow: {
      DEFAULT: '0 0 0 0.125rem rgba(0, 0, 0, 0.1)',
      navbar: '0 2px 0 0 #f5f5f5',
      box: '0 2px 3px rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 10%)',
      success: '0 0 0 0.125em rgb(72 199 142 / 25%)',
      info: '0 0 0 0.125em rgb(32 156 238 / 25%)',
      warning: '0 0 0 0.125em rgb(255 224 138 / 25%)',
      danger: '0 0 0 0.125em rgb(241 70 104 / 25%)'
    },
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      xxl: '1536px'
    }
  }
});
