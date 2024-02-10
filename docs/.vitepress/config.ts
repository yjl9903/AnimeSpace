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
    socialLinks: [{ icon: 'github', link: 'https://github.com/yjl9903/AnimeSpace' }],
    search: {
      provider: 'local'
    },
    // algolia: {
    //   appId: 'FGCMJD7ZM9',
    //   apiKey: 'dad73f46ec1ba55810109fb2fa7a472b',
    //   indexName: 'docs'
    // },
    nav: [
      { text: 'AnimeSpace', link: '/animespace/' },
      { text: 'AnimeGarden', link: '/animegarden/' },
      {
        text: '生态系统',
        items: [
          { text: 'AnimeSpace', link: '/animespace/' },
          { text: 'AnimeGarden', link: '/animegarden/' },
          { text: 'Anitomy', link: '/anitomy/' },
          { text: 'bgmd', link: '/bgmd/' },
          { text: 'bgmc', link: '/bgmc/' },
          { text: 'tmdbc', link: '/tmdbc/' },
          { text: 'nfo.js', link: '/nfo.js/' }
        ]
      }
    ],
    sidebar: {
      '/': [
        {
          text: '开始',
          items: [
            {
              text: 'AnimeSpace',
              link: '/animespace/'
            },
            {
              text: '安装 CLI',
              link: '/animespace/installation/'
            }
          ]
        },
        {
          text: '配置',
          items: [
            {
              text: '配置根目录',
              link: '/animespace/config/'
            },
            {
              text: '放映计划',
              link: '/animespace/config/plan'
            },
            {
              text: '集成媒体库软件',
              link: '/animespace/config/jellyfin'
            }
          ]
        },
        {
          text: '命令行程序',
          items: [
            {
              text: '使用 CLI',
              link: '/animespace/cli/'
            }
          ]
        },
        {
          text: '生态系统',
          items: [
            { text: 'AnimeGarden', link: '/animegarden/' },
            { text: 'Anitomy', link: '/anitomy/' },
            { text: 'bgmd', link: '/bgmd/' },
            { text: 'bgmc', link: '/bgmc/' },
            { text: 'tmdbc', link: '/tmdbc/' },
            { text: 'nfo.js', link: '/nfo.js/' }
          ]
        }
      ],
      '/animegarden/': [
        { text: 'AnimeGarden', link: '/animegarden/' },
        { text: '高级搜索', link: '/animegarden/search' },
        { text: '收藏夹管理', link: '/animegarden/collection' },
        { text: 'RSS 订阅', link: '/animegarden/rss' }
      ]
    }
  }
});
