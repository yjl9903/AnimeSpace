import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copy, remove } from 'fs-extra';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { MagnetStore, Parser } from '../src';

const dir = path.join(fileURLToPath(import.meta.url), '../..');
const sourceDB = path.join(dir, './prisma/anime.db');
const testDB = path.join(dir, './test/anime.db');

beforeAll(async () => {
  await copy(sourceDB, testDB);
});

afterAll(async () => {
  await remove(testDB);
});

describe('Magnet Store', () => {
  const database = new MagnetStore({ url: testDB });

  it('should index', async () => {
    await database.index({ endPage: 1 });
    expect(await database.list()).toHaveLength(80);

    await database.index({ endPage: 1 });
    expect(await database.list()).toHaveLength(80);
  });

  it('should search', async () => {
    const list = await database.list();
    const title1 = list.find((m) => m.type === '動畫')!.title;
    const title2 = list.reverse().find((m) => m.type === '動畫')!.title;
    expect(await database.search(title1)).toHaveLength(1);
    expect(await database.search(title2)).toHaveLength(1);
    expect(await database.search([title1, title2])).toHaveLength(2);
    expect(await database.search('1a2s3d4f5g6h7j8k9l')).toHaveLength(0);
  });
});

describe('Parser', () => {
  it('should parse', () => {
    const parser = new Parser();

    expect(
      parser.parse('【DMHY】【黑色五葉草/Black_Clover】[161][繁體][720P][MP4]')
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Black_Clover",
        ],
        "ep": 161,
        "tags": [
          "720P",
          "MP4",
          "繁體",
        ],
        "title": "黑色五葉草",
      }
    `);

    expect(
      parser.parse(
        '[NC-Raws] 继母的拖油瓶是我的前女友 / Mamahaha no Tsurego - 01 (B-Global 1920x1080 HEVC AAC MKV)'
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Mamahaha no Tsurego",
        ],
        "ep": 1,
        "tags": [
          "1920x1080",
          "B-Global",
          "HEVC",
          "MKV",
          "AAC",
        ],
        "title": "继母的拖油瓶是我的前女友",
      }
    `);

    expect(
      parser.parse(
        '【喵萌奶茶屋】★04月新番★[夏日重現/Summer Time Rendering][13][720p][繁日雙語][招募翻譯片源] '
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Summer Time Rendering",
        ],
        "ep": 13,
        "tags": [
          "720p",
          "繁日雙語",
        ],
        "title": "夏日重現",
      }
    `);

    expect(
      parser.parse(
        '[Lilith-Raws] 來自深淵 烈日的黃金鄉 / Made in Abyss - Retsujitsu no Ougonkyou - 01 [Baha][WEB-DL][1080p][AVC AAC][CHT][MP4]'
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Made in Abyss - Retsujitsu no Ougonkyou",
        ],
        "ep": 1,
        "tags": [
          "1080p",
          "WEB-DL",
          "Baha",
          "MP4",
          "AVC",
          "AAC",
          "CHT",
        ],
        "title": "來自深淵 烈日的黃金鄉",
      }
    `);

    expect(
      parser.parse(
        '[桜都字幕组] 森林里的熊先生，冬眠中。 / Mori no Kuma-san, Toumin-chuu. [01][1080p][简繁内封]'
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Mori no Kuma-san, Toumin-chuu.",
        ],
        "ep": 1,
        "tags": [
          "1080p",
          "简繁内封",
        ],
        "title": "森林里的熊先生，冬眠中。",
      }
    `);

    expect(
      parser.parse(
        '[天月搬運組] 組長女兒與保姆 / Kumichou Musume to Sewagakari - 01 [1080P][簡繁日外掛]'
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Kumichou Musume to Sewagakari",
        ],
        "ep": 1,
        "tags": [
          "1080P",
          "簡繁日外掛",
        ],
        "title": "組長女兒與保姆",
      }
    `);

    expect(
      parser.parse(
        '[悠哈璃羽字幕社&LoliHouse] 街角魔族 第二季 / Machikado Mazoku S2 - 09 [WebRip 1080p HEVC-10bit AAC][简繁内封字幕] '
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Machikado Mazoku S2",
        ],
        "ep": 9,
        "tags": [
          "1080p",
          "WebRip",
          "HEVC-10bit",
          "AAC",
          "简繁内封字幕",
        ],
        "title": "街角魔族 第二季",
      }
    `);

    expect(
      parser.parse(
        '[AI-Raws&ANK-Raws] Odd Taxi / ODDTAXI / 奇巧計程車 / 奇巧出租车 BDRip 1080p MKV '
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "ODDTAXI",
          "奇巧計程車",
          "奇巧出租车",
        ],
        "ep": undefined,
        "tags": [
          "1080p",
          "BDRip",
          "MKV",
        ],
        "title": "Odd Taxi",
      }
    `);

    expect(
      parser.parse(
        '[霜庭云花&爱咕&动漫萌][契约之吻/Engage Kiss/エンゲージ·キス][01][WebRip 720P AVC][简体内嵌]'
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [
          "Engage Kiss",
          "エンゲージ·キス",
        ],
        "ep": 1,
        "tags": [
          "720P",
          "WebRip",
          "AVC",
          "简体",
          "内嵌",
        ],
        "title": "契约之吻",
      }
    `);

    expect(
      parser.parse(
        '[ANi] 異世界迷宮裡的後宮生活 - 01 [1080P][Baha][WEB-DL][AAC AVC][CHT][MP4]'
      )
    ).toMatchInlineSnapshot(`
      {
        "alias": [],
        "ep": 1,
        "tags": [
          "1080P",
          "WEB-DL",
          "Baha",
          "MP4",
          "AVC",
          "AAC",
          "CHT",
        ],
        "title": "異世界迷宮裡的後宮生活",
      }
    `);
  });
});
