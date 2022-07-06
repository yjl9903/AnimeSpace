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
  ├── magnet.json    # Cache found magnets
  ├── anime.json     # Cache found animes
  └── store.json     # Cache OSS upload logs
```

### Config

Global config:

```yaml
# ~/.animepaste/config.yaml

plan: ./plans/2022-4.yaml

server:
  baseURL: https://anime.xlorpaste.cn/api/
  # baseURL: http://localhost:8788/api/
  token:

store:
  local: # Local anime store
    path: ./anime
  ali:   # Ali OSS config
    accessKeyId: ''
    accessKeySecret: ''
    regionId: 'cn-shanghai'
```

Plan config:

```yaml
# ~/.animepaste/plans/2022-4.yaml

name: '2022 年 4 月新番'

time: 2022-4

onair:
  - name: 相合之物
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
