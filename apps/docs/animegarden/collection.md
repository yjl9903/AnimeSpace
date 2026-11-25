# 收藏夹管理

收藏夹可以把多个搜索条件聚合为一个订阅链接：一个收藏夹最多保存 50 个筛选条件，订阅地址始终返回每个条件的最新结果。

## 创建收藏夹

```bash
curl -X POST https://api.animes.garden/collection \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "本周新番",
    "authorization": "my-local-secret",
    "filters": [
      {
        "name": "上伊那牡丹",
        "searchParams": "subject=543360&fansub=LoliHouse",
        "subjects": [543360],
        "fansubs": ["LoliHouse"]
      },
      {
        "name": "全部动画",
        "searchParams": "type=动画",
        "types": ["动画"]
      }
    ]
  }'
```

字段说明：

- `name`：收藏夹显示名称，不参与 hash 计算；
- `authorization`：调用方自行生成的字符串，用于后续更新收藏夹，不参与 hash 计算，也不控制创建或公开读取权限；
- `filters[].searchParams`：仅用于展示还原，真正生效的是同级的结构化字段（`subjects` / `fansubs` / `types` / `search` / `include` / `keywords` / `exclude` / `after` / `before` / `provider` / `preset` 等）；
- 修改名称不会更新已有收藏夹；修改条件会生成新的 hash。

`PUT /collection` 可以创建或更新收藏夹（以 hash 定位），请求体相同。

## 查看与订阅

创建成功后返回 `hash`，之后：

- 页面：<https://animes.garden/collection/{hash}>
- API：`GET https://api.animes.garden/collection/{hash}`（每个条件返回第 1 页，最多 1000 条）
- RSS：<https://api.animes.garden/collection/{hash}/feed.xml>
