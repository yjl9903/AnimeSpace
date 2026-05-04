# nfo.js

Parse and stringify [nfo files](https://kodi.wiki/view/NFO_files).

> NFO files contain information about the release, such as the digital media title, authorship, year, or license information. This information is delivered for publishing through digital media to make it searchable on the web as well as within local catalogues and libraries.
>
> From [.nfo - Wikipeida](https://en.wikipedia.org/wiki/.nfo).

👷‍♂️ Still work in progress.

## Installation

```bash
npm i nfojs
```

## Usage

```ts
import { stringifyTVShow } from 'nfojs'

const text = stringifyTVShow({
  title: '【我推的孩子】',
  ratings: [{ name: 'bangumi', max: '10', value: '7.8' }],
  uniqueId: [{ type: 'bangumi', value: '386809' }],
  userrating: '7',
  plot: `“在演艺圈里，谎言就是武器。 ”
在小城市工作的妇产科医生・五郎，有一天他所推的偶像“B小町”出现在了他的面前。“B小町”有着一个禁忌的秘密。
如此这般的两人实现了最糟糕的相遇，从此命运的齿轮开始转动——`,
  season: '1',
  premiered: '2023-04-12',
  actor: [
    {
      name: '平牧大辅',
      role: '导演',
      thumb: 'https://lain.bgm.tv/pic/crt/l/85/d2/13069_prsn_9C181.jpg'
    },
    {
      name: '田中仁',
      role: '脚本'
    }
  ]
})
```
