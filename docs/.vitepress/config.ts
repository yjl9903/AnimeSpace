import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Anime Paste',
  description: '你所热爱的就是你的动画',
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
    footer: {
      message: 'Released under the AGPL-3.0 License.',
      copyright: 'Copyright © 2021-PRESENT XLor'
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
