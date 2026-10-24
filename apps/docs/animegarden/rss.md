# RSS 订阅

AnimeGarden 的所有搜索条件都可以直接转换为 RSS 订阅链接，订阅地址为 `https://api.animes.garden/feed.xml`。

## 基础用法

- 全站最新资源: <https://api.animes.garden/feed.xml>
- 按 Bangumi 条目订阅: <https://api.animes.garden/feed.xml?subject=543360>
- 按字幕组订阅: <https://api.animes.garden/feed.xml?fansub=LoliHouse>
- 组合条件: <https://api.animes.garden/feed.xml?subject=543360&fansub=LoliHouse&keyword=1080p>

## 查询参数

与 `GET /resources` 的查询参数完全一致：

| 参数 | 说明 |
| --- | --- |
| `search` | 搜索关键词；存在时覆盖 `include` |
| `include` | 标题包含任一关键词（OR），可重复 |
| `keyword` | 标题必须包含全部关键词（AND），可重复 |
| `exclude` | 排除标题包含任一关键词的资源，可重复 |
| `type` | 资源类型（动画 / 合集 / 音乐…），可重复 |
| `subject` | Bangumi 条目 ID，可重复 |
| `fansub` / `publisher` | 字幕组 / 发布者名称（以 `/teams`、`/users` 返回的 name 为准），可重复，二者取并集 |
| `after` / `before` | 发布时间范围（包含边界） |
| `provider` | 限定来源（`dmhy` / `mikan` / `moe` / `ani`） |
| `preset` | 预设筛选，目前仅 `bangumi`（过滤 RAW 搬运等刷屏资源） |
| `page` / `pageSize` | 分页；默认返回 100 条，`pageSize` 越界或无效时回退为 100，最大 1000 |
| `tracker` | `tracker=false` 时 enclosure 不附带 tracker 列表 |
| `duplicate` | 是否包含跨站重复资源 |

## 扩展字段

每个条目在命名空间 `xmlns:animegarden="https://animes.garden/ns/rss/1.0"` 下携带 `<animegarden:subjectId>`（Bangumi 条目 ID），可用于按番剧分组或联动 Bangumi 元数据。未绑定条目的资源省略该字段。

## 与下载器集成

- [AutoBangumi](https://github.com/EstrellaXD/AutoBangumi)：所有订阅链接均可直接使用。
- [Ani-RSS](https://github.com/wushuo894/ani-rss)：集成方法见 [Ani-RSS 集成](./ani-rss)。

你也可以使用[收藏夹](./collection)功能，将多个搜索条件聚合成一个订阅链接，就像使用[蜜柑计划](https://mikanani.me/)。
