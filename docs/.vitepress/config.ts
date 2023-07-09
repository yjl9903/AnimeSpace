import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'AnimeSpace',
  description: '你所热爱的就是你的动画',
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]
  ],
  lastUpdated: true,
  themeConfig: {
    logo: '/favicon.svg',
    editLink: {
      pattern: 'https://github.com/yjl9903/AnimeSpace/tree/main/docs/:path',
      text: '反馈修改建议'
    },
    footer: {
      message: 'Released under the AGPL-3.0 License.',
      copyright: 'Copyright © 2023-PRESENT XLor'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yjl9903/AnimeSpace' }
    ],
    algolia: {
      appId: 'FGCMJD7ZM9',
      apiKey: 'dad73f46ec1ba55810109fb2fa7a472b',
      indexName: 'docs'
    },
    nav: [
      { text: '部署', link: '/deploy/' },
      { text: '管理', link: '/admin/' },
      { text: '体验', link: 'https://github.com/yjl9903/AnimeSpace' }
    ],
    sidebar: {
      '/': [
        {
          text: 'AnimeSpace',
          items: [{ text: '介绍', link: '/intro/' }]
        },
        {
          text: '部署',
          items: [
            {
              text: '开始',
              link: '/deploy/'
            },
            {
              text: '安装 CLI',
              link: '/deploy/admin'
            },
            {
              text: '集成媒体库软件',
              link: '/deploy/jellyfin'
            }
          ]
        },
        {
          text: '管理',
          items: [
            {
              text: '配置',
              link: '/admin/'
            },
            {
              text: '放映计划',
              link: '/admin/plan'
            },
            {
              text: '使用 CLI',
              link: '/admin/usage'
            }
          ]
        }
      ]
    }
  }
});
