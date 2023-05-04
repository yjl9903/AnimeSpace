import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

import { makeSystem } from '../src';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('system', () => {
  it('should load', async () => {
    const root = path.join(__dirname, '../../core/test/fixtures/space');
    const system = await makeSystem(root);
    expect(await system.space.plans()).toEqual([
      {
        date: new Date('2023-04-01T13:00:00.000Z'),
        name: '2023-04-04 新番放送计划',
        onair: [
          {
            bgmId: '323651',
            date: new Date('2023-04-01T13:00:00.000Z'),
            fansub: ['Lilith-Raws', 'ANi'],
            keywords: {
              exclude: [],
              include: [['熊熊勇闯异世界 Punch!']]
            },
            season: 2,
            state: 'onair',
            title: '熊熊勇闯异世界 Punch!',
            translations: {},
            type: '番剧'
          },
          {
            bgmId: '404804',
            date: new Date('2023-04-01T13:00:00.000Z'),
            fansub: ['SweetSub'],
            keywords: {
              exclude: [],
              include: [['天国大魔境', 'Tengoku Daimakyou']]
            },
            season: 1,
            state: 'onair',
            title: '天国大魔境',
            translations: {
              unknown: ['Tengoku Daimakyou']
            },
            type: '番剧'
          },
          {
            bgmId: '376703',
            date: new Date('2023-04-01T13:00:00.000Z'),
            fansub: ['喵萌奶茶屋'],
            keywords: {
              exclude: ['闪耀色彩'],
              include: [['偶像大师', 'iDOLM@STER'], ['灰姑娘女孩'], ['U149']]
            },
            season: 1,
            state: 'onair',
            title: '偶像大师 灰姑娘女孩 U149',
            translations: {},
            type: '番剧'
          }
        ],
        state: 'onair'
      }
    ]);
  });
});
