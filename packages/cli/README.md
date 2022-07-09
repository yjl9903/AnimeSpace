# Anime Paste CLI

Command line application for managing [Anime Paste](https://github.com/XLorPaste/AnimePaste).

## Features

+ Download videos from [動漫花園](https://share.dmhy.org/).
+ Upload videos to [阿里云 - 视频点播](https://www.aliyun.com/product/vod).
+ Organizing your videos locally.
+ Interact with [AnimePaste](https://anime.xlorpaste.cn).

## Directory structure

```text
~/.animepaste/
  ├── plans/         # Plans folder
  ├── anime/         # Anime store
  ├── cache/         # Videos cache
  ├── config.yaml    # AnimePaste config file
  ├── store.db       # Cache found magnets and uploaded videos (SQLite)
  └── anime.json     # Cache found animes
```

### Config

Global config:

```yaml
# ~/.animepaste/config.yaml

plan:
  - ./plans/2022-4.yaml

server:
  baseURL: https://anime.xlorpaste.cn/api/
  # baseURL: http://localhost:8788/api/
  token:

store:
  local: # Local anime store
    path: ./anime
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

MIT License © 2021 [XLor](https://github.com/yjl9903)
