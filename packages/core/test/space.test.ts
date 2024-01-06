import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rimraf } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadSpace, loadPlans } from '../src';
import { fs as LocalFS } from 'breadfs/node';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('Load Space', () => {
  it('should work', async () => {
    const root = path.join(__dirname, './fixtures/space');
    const space = await loadSpace(root);

    expect({
      ...space,
      resolvePath: undefined,
      plans: undefined
    }).toMatchInlineSnapshot(`
      {
        "plans": undefined,
        "plugins": [],
        "preference": {
          "extension": {
            "exclude": [],
            "include": [
              "mp4",
              "mkv",
            ],
          },
          "fansub": {
            "exclude": [],
            "order": [],
          },
          "format": {
            "anime": "{title}",
            "episode": "[{fansub}] {title} - E{ep}.{extension}",
            "film": "[{fansub}] {title}.{extension}",
            "ova": "[{fansub}] {title}.{extension}",
          },
          "keyword": {
            "exclude": [],
            "order": {
              "format": [
                "mp4",
                "mkv",
              ],
              "language": [
                "简",
                "繁",
              ],
              "resolution": [
                "1080",
                "720",
              ],
            },
          },
        },
        "resolvePath": undefined,
        "root": Path {
          "_fs": BreadFS {
            "provider": NodeProvider {
              "name": "node",
            },
          },
          "_path": "${LocalFS.path(root).toString()}",
        },
        "storage": {
          "anime": Path {
            "_fs": BreadFS {
              "provider": NodeProvider {
                "name": "node",
              },
            },
            "_path": "${LocalFS.path(root, 'anime').toString()}",
          },
          "cache": Path {
            "_fs": BreadFS {
              "provider": NodeProvider {
                "name": "node",
              },
            },
            "_path": "${LocalFS.path(root, 'cache').toString()}",
          },
          "library": Path {
            "_fs": BreadFS {
              "provider": NodeProvider {
                "name": "node",
              },
            },
            "_path": "${LocalFS.path(root, 'anime').toString()}",
          },
        },
      }
    `);

    expect(await loadPlans(space)).toEqual([
      {
        date: new Date('2023-04-01 13:00:00 UTC'),
        name: '2023-04-04 新番放送计划',
        status: 'onair',
        onair: [
          {
            title: '熊熊勇闯异世界 Punch!',
            alias: [],
            translations: {},
            type: '番剧',
            status: 'onair',
            season: 2,
            bgm: '323651',
            fansub: ['Lilith-Raws', 'ANi'],
            date: new Date('2023-04-01 13:00:00 UTC'),
            keywords: {
              include: [['熊熊勇闯异世界 Punch!']],
              exclude: []
            }
          },
          {
            title: '天国大魔境',
            alias: [],
            translations: {
              unknown: ['Tengoku Daimakyou']
            },
            type: '番剧',
            status: 'onair',
            // season: 1,
            bgm: '404804',
            fansub: 'SweetSub',
            date: new Date('2023-04-01 13:00:00 UTC'),
            keywords: {
              include: [['天国大魔境', 'Tengoku Daimakyou']],
              exclude: []
            }
          },
          {
            title: '偶像大师 灰姑娘女孩 U149',
            alias: [],
            translations: {},
            type: '番剧',
            status: 'onair',
            // season: 1,
            bgm: 376703,
            fansub: '喵萌奶茶屋',
            date: new Date('2023-04-01 13:00:00 UTC'),
            keywords: {
              include: [
                ['偶像大师 灰姑娘女孩 U149'],
                ['偶像大师', 'iDOLM@STER'],
                ['灰姑娘女孩'],
                ['U149']
              ],
              exclude: ['闪耀色彩']
            }
          }
        ]
      }
    ]);
  });
});

describe('Create Space', () => {
  const root = path.join(__dirname, `./fixtures/temp`);
  it('should work', async () => {
    const space = await loadSpace(root);
    const loaded = await loadSpace(root);
    expect({ ...loaded, resolvePath: undefined, plans: undefined }).toEqual({
      ...space,
      resolvePath: undefined,
      plans: undefined
    });
    expect(await loadPlans(loaded)).toEqual(await loadPlans(space));
  });

  beforeEach(async () => {
    await rimraf(root);
  });

  afterEach(async () => {
    await rimraf(root);
  });
});
