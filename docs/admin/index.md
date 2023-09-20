# 配置

AnimeSpace 默认使用 `~/.animespace/` （或者 `ANIMESPACE_ROOT` 环境变量）作为工作目录，储存所有配置文件，动画数据库和视频资源。

安装完成后，你必须运行初始化工作目录。

```bash
anime space
```

> 如果我们共享相似喜好，你可以直接使用我的[配置目录](https://github.com/yjl9903/.animespace)。
>
> 注意: 克隆仓库后修改动画的存储位置。

## 全局配置目录

```txt
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

## 根配置文件

该文件位于：`~/.animespace/anime.yaml`。

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

## 放映计划配置

在根配置文件的 `plans` 字段下，你可以指定一个放映计划的配置文件路径列表（相对于工作目录）。

推荐在工作目录下创建一个 `plans` 文件夹，用于储存所有的放映计划配置文件。

详细配置见 [放映计划](./plan.md)。
