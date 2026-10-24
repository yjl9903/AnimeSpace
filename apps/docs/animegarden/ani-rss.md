# Ani-RSS 集成

[Ani-RSS](https://github.com/wushuo894/ani-rss) 是基于 RSS 的自动追番、订阅、下载、刮削、洗版工具。AnimeGarden 聚合了 動漫花園 / 蜜柑计划 / 萌番组 / ANi 四个来源，可以作为 Ani-RSS 订阅的主源或备用源。

## 添加订阅

在 Ani-RSS 的"添加订阅"中：

- **主 RSS**：填入 AnimeGarden 的订阅链接，例如
  `https://api.animes.garden/feed.xml?subject=543360&fansub=LoliHouse`
- **BgmUrl**：填入对应的 Bangumi 条目链接（如 `https://bgm.tv/subject/543360`）。AnimeGarden RSS 中的 `animegarden:subjectId` 与 Bangumi 条目 ID 一致，集数与刮削信息可以正常联动
- **备用 RSS**：在 Ani-RSS 设置中开启「备用 RSS」后，可以把同一番剧下其他字幕组或来源的订阅链接填为备用源，提高容灾能力

## 常用订阅链接

| 需求 | 链接 |
| --- | --- |
| 单番 + 指定字幕组 | `feed.xml?subject={subjectId}&fansub={字幕组名}` |
| 单番全部版本 | `feed.xml?subject={subjectId}` |
| 排除合集 / PV / NC | `feed.xml?subject={subjectId}&exclude=合集&exclude=PV&exclude=NC` |
| 指定字幕组的当季动画 | `feed.xml?fansub={字幕组名}&type=动画&after={季度开始日期}` |
| 多条件聚合 | 使用[收藏夹](./collection)生成一个订阅链接 |

完整参数说明见 [RSS 订阅](./rss)。字幕组名称以 [`GET /teams`](https://api.animes.garden/teams) 返回的 `name` 为准。

## 注意事项

- RSS 默认返回最新 100 条（`pageSize` 最大 1000）；补档或长期未更新的订阅建议配合 `after` 使用；
- Bangumi 条目绑定仍在完善中，个别资源没有 `subjectId`，建议同时用 `keyword` / `search` 条件兜底；
- AnimeGarden 每约 5 分钟同步一次上游来源，订阅轮询间隔无需低于此值。
