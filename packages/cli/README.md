# AnimeSpace 命令行程序

This is the command line application package for managing [AnimeSpace](https://github.com/yjl9903/AnimeSpace).

## 全局配置目录

```text
~/.animespace/
  ├── plans/                     # Plans folder
  │   ├─ 2022-04.yml
  │   └─ 2022-07.yml
  ├── anime/                     # Anime store
  │   └─ 相合之物
  │      ├─ 相合之物 - S01E01.mp4
  │      ├─ 相合之物 - S01E02.mp4
  │      └─ 相合之物 - S01E03.mp4
  └── anime.yaml                # AnimeSpace config file
```

### 全局配置示例

```yaml
# ~/.animespace/anime.yaml

storage: ./anime

preference:
  format:
    anime: '{title}'
    episode: '[{fansub}] {title} - E{ep}.{extension}'
    film: '[{fansub}] {title}.{extension}'
    ova: '[{fansub}] {title}.{extension}'
  extension:
    include: [mp4, mkv]
    exclude: []
  keyword:
    order:
      format: [mp4, mkv]
      resolution: ['1080', '720']
      language: ['简', '繁']
    exclude: []
  fansub:
    order: []
    exclude: []

plans:
  - ./plans/*.yaml

plugins:
  - name: animegarden
    provider: aria2

  - name: local
    introspect: true
    refresh: true

  - name: bangumi
    username: '603937'
```

### 放映计划

你需要讲所有的放映计划配置文件放置在 `./plans/` 目录下（根据上面的默认配置）。

配置方式见 [放映计划](./plan)。

## 使用

Make sure you have setup above configs, and then

```bash
anime refresh
```

It will automatically search the resources, download, and organize them based on the plan set in your config.
