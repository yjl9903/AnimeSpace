# 🌸 Anime Garden

[動漫花園](https://share.dmhy.org/) 第三方 [镜像站](https://animes.garden) 以及 [动画 BT 资源聚合站](https://animes.garden).

+ ☁️ 为开发者准备的开放 [API 接口](https://animes.garden/docs/api)
+ 📺 查看 [动画放送时间表](https://animes.garden/anime) 来找到你喜欢的动画
+ 🔖 支持丰富的高级搜索, 例如: `葬送的芙莉莲 +简体内嵌 字幕组:桜都字幕组 类型:动画`
+ 📙 自定义 RSS 订阅链接, 例如: [葬送的芙莉莲](animes.garden/feed.xml?filter=%5B%7B%22fansubId%22:%5B%22619%22%5D,%22type%22:%22%E5%8B%95%E7%95%AB%22,%22include%22:%5B%22%E8%91%AC%E9%80%81%E7%9A%84%E8%8A%99%E8%8E%89%E8%8E%B2%22%5D,%22keywords%22:%5B%22%E7%AE%80%E4%BD%93%E5%86%85%E5%B5%8C%22%5D%7D%5D)
+ ⭐ 搜索条件收藏夹和生成聚合的 RSS 订阅链接
+ 👷‍♂️ 支持与 [AutoBangumi](https://www.autobangumi.org/) 和 [AnimeSpace](https://github.com/yjl9903/AnimeSpace) 集成

![home](https://cdn.jsdelivr.net/gh/yjl9903/animegarden/assets/home.jpeg)

## 高级搜索

在搜索框，支持以下几种高级指令:

+ **标题匹配**：
  + `标题:xxx`：返回的每一条结果的标题必须**匹配其指定的某一个关键词**
  + `包含:xxx` 或者 `+xxx`：返回的每一条结果的标题必须**匹配其指定的所有关键词**
  + `排除:xxx` 或者 `-xxx`：返回的每一条结果的标题不能包含**其指定的所有关键词**
+ `fansub:xxx`：返回某一字幕组的所有结果
+ `after:xxx`：返回结果的创建时间在 `xxx` **之后**
+ `before:xxx`：返回结果的创建时间在 `xxx` **之前**

详细见 [高级搜索](/animegarden/search)。

## 收藏夹

详细见 [收藏夹](/animegarden/collection)。

## RSS 订阅

从 AnimeGarden 获得的所有 RSS 订阅链接均可以在 AutoBangumi 中使用。

详细见 [RSS 订阅](/animegarden/rss)。
