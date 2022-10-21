# Anime Paste CLI

<p align="center">「 你所热爱的就是你的动画 」</p>

[![version](https://img.shields.io/npm/v/animepaste?color=rgb%2850%2C203%2C86%29&label=AnimePaste)](https://www.npmjs.com/package/animepaste)

Paste your favourite anime online.

Anime Paste is yet another solution for automatically downloading bangumis.

This is the command line application package for managing [Anime Paste](https://github.com/XLorPaste/AnimePaste).

Anime Paste includes **an admin command-line application** to config what bangumis and how to download and **a builtin web application** to view bangumis which can also be deployed on [Cloudflare Pages](https://pages.cloudflare.com/). It also support download resource for the media library software like [Jellyfin](https://github.com/jellyfin/jellyfin) and so on.

All the bangumi resource is automatically fetched from [動漫花園](https://share.dmhy.org/). Sincere thanks to [動漫花園](https://share.dmhy.org/) and all the fansubs.

+ 📺 [Online Demo | 在线 Demo](https://anime.xlorpaste.cn/)
+ 📖 [Document | 文档](https://anime.docs.xlorpaste.cn/)

## Features

+ Download videos from [動漫花園](https://share.dmhy.org/).
+ Upload videos to [阿里云 - 视频点播](https://www.aliyun.com/product/vod).
+ Organizing your videos locally.
+ Interact with [AnimePaste](https://anime.xlorpaste.cn).

## Directory structure

```text
~/.animepaste/
  ├── plans/                     # Plans folder
  │   ├─ 2022-04.yml
  │   └─ 2022-07.yml
  ├── anime/                     # Anime store
  │   └─ 相合之物
  │      ├─ 相合之物 - S01E01.mp4
  │      ├─ 相合之物 - S01E02.mp4
  │      └─ 相合之物 - S01E03.mp4
  ├── cache/                     # Videos cache
  │   ├─ xxx.mp4
  │   └─ yyy.mp4
  ├── config.yaml                # AnimePaste config file
  └── anime.db                   # SQLite database file
```

### Config

Global config:

```yaml
# ~/.animepaste/config.yaml

plans:
  - ./plans/2022-7.yaml

sync:
  local: true
  # remote:
  #   baseURL: http://localhost:8788/
  #   token: ''

store:
  local: # Local anime store
    anime: ./anime
    cache: ./cache
  ali:   # Ali OSS config
    accessKeyId: ''
    accessKeySecret: ''
    regionId: 'cn-shanghai'
```

Plan config:

```yaml
# ~/.animepaste/plans/2022-4.yaml

name: '2022 年 4 月新番'

date: '2022-04-01 00:00'

onair:
  - title: 相合之物
    bgmId: '333664'
    fansub:
      - Lilith-Raws
```

## Usage

Make sure you have setup above configs, and then

```bash
anime watch
```

It will automatically search the resources, download, and upload them to OSS based on the plan set in your config.

## License

AGPL-3.0 License © 2021 [XLor](https://github.com/yjl9903)
