# 配置

Anime Paste 默认使用 `~/.animespace/` （或者 `ANIMEPASTE_ROOT` 环境变量）作为工作目录，储存所有配置文件，动画数据库和视频资源。

安装完成后，你必须运行

```bash
anime space
```

初始化工作目录。

## 目录结构

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
  ├── cache/                     # Videos cache
  │   ├─ xxx.mp4
  │   └─ yyy.mp4
  └── anime.yaml                # AnimeSpace config file
```

## 根配置文件

该文件位于：`~/.animespace/anime.yaml`。

```yaml
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

## 放映计划配置

在根配置文件的 `plans` 字段下，你可以指定一个放映计划的配置文件路径列表（相对于工作目录）。

推荐在工作目录下创建一个 `plans` 文件夹，用于储存所有的放映计划配置文件。

详细配置见 [放映计划](./plan.md)。
