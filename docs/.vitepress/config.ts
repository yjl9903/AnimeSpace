import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Anime Paste',
  description: 'Paste your favourite anime online.',
  base: '/docs/',
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]
  ],
  themeConfig: {
    logo: '/favicon.svg',
    editLink: {
      pattern: 'https://github.com/XLorPaste/AnimePaste/tree/main/docs/:path',
      text: '反馈修改建议'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/XLorPaste/AnimePaste' }
    ],
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '配置', link: '/config/' },
      { text: '体验', link: 'https://anime.xlorpaste.cn' }
    ],
    sidebar: {
      '/': [
        {
          text: '指南',
          items: [
            {
              text: '开始',
              link: '/guide/'
            }
          ]
        },
        {
          text: '配置',
          items: [
            {
              text: '配置',
              link: '/config/'
            }
          ]
        }
      ]
    }
  }
});
