import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rimraf } from 'rimraf';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { loadSpace } from '../src';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('Load Space', () => {
  it('should work', async () => {
    const root = path.join(__dirname, './fixtures/space');
    const space = await loadSpace(root);
    expect({ ...space, plans: undefined }).toEqual({
      plugins: [],
      preference: {
        format: {
          anime: '{title} ({yyyy}-{mm})',
          episode: '[{fansub}] {title} - E{ep}.{extension}',
          film: '[{fansub}] {title}.{extension}',
          ova: '[{fansub}] {title}.{extension}'
        },
        extension: {
          include: ['mp4', 'mkv'],
          exclude: []
        },
        keyword: {
          order: {
            format: ['mp4', 'mkv'],
            language: ['简', '繁'],
            resolution: ['1080', '720']
          },
          exclude: []
        },
        fansub: {
          order: [],
          exclude: []
        }
      },
      root,
      storage: path.join(root, 'anime')
    });
    expect(await space.plans()).toEqual([
      {
        date: new Date('2023-04-01 13:00:00 UTC'),
        name: '2023-04-04 新番放送计划',
        state: 'onair',
        onair: [
          {
            title: '熊熊勇闯异世界 Punch!',
            type: '番剧',
            state: 'onair',
            season: 2,
            bgmId: '323651',
            fansub: ['Lilith-Raws', 'ANi'],
            date: new Date('2023-04-01 13:00:00 UTC'),
            keywords: {
              include: [['熊熊勇闯异世界 Punch!']],
              exclude: []
            }
          },
          {
            title: '天国大魔境',
            type: '番剧',
            state: 'onair',
            season: 1,
            bgmId: '404804',
            fansub: 'SweetSub',
            date: new Date('2023-04-01 13:00:00 UTC'),
            keywords: {
              include: [['天国大魔境']],
              exclude: []
            }
          },
          {
            title: '偶像大师 灰姑娘女孩 U149',
            type: '番剧',
            state: 'onair',
            season: 1,
            bgmId: '376703',
            fansub: '喵萌奶茶屋',
            date: new Date('2023-04-01 13:00:00 UTC'),
            keywords: {
              include: [['偶像大师', 'iDOLM@STER'], ['灰姑娘女孩'], ['U149']],
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
    expect({ ...loaded, plans: undefined }).toEqual({
      ...space,
      plans: undefined
    });
    expect(await loaded.plans()).toEqual(await space.plans());
  });

  beforeEach(async () => {
    await rimraf(root);
  });

  afterEach(async () => {
    await rimraf(root);
  });
});
