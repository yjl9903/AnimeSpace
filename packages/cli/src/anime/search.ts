import type { Item, SiteMeta } from 'bangumi-data';

import prompts from 'prompts';
import { debug as createDebug } from 'debug';
import { distance } from 'fastest-levenshtein';
import { subMonths } from 'date-fns';
import { link, bold, dim, lightGreen } from 'kolorist';

import type { AnimeType } from '../types';

import { context } from '../context';
import { IndexListener, info } from '../logger';
import { bangumiLink, groupBy } from '../utils';

import { Anime } from './anime';
import { getBgmDate, getBgmTitle, getBgmId, formatEP } from './utils';

interface SearchOption {
  type: AnimeType;
  raw?: boolean;
  plan?: boolean;
  year?: string;
  month?: string;
  title?: string;

  // Filter outdated resources with same name
  beginDate?: Date;
}

const debug = createDebug('anime:search');

export async function userSearch(
  anime: string | undefined,
  option: SearchOption
) {
  const bgms = await promptSearch(anime, option);
  const animes: Anime[] = [];
  for (const bgm of bgms) {
    const anime =
      (await context.getAnime(getBgmId(bgm)!)) ?? Anime.bangumi(bgm);
    const keywords = [bgm.title, ...Object.values(bgm.titleTranslate).flat()];
    option.beginDate = subMonths(new Date(bgm.begin), 1);
    const res = await search(anime, keywords, option);
    if (res) animes.push(res);
  }
  if (option.plan) {
    outputPlan(animes);
  }
}

export async function daemonSearch(
  bgmId: string,
  optionKeywords?: string[],
  option: SearchOption = { type: 'tv' }
) {
  const { items } = await importBgmdata();
  const animes: Anime[] = [];
  let found = false;
  for (const bgm of items) {
    if (bgmId === getBgmId(bgm)) {
      found = true;
      const anime =
        (await context.getAnime(getBgmId(bgm)!)) ?? Anime.bangumi(bgm);
      const keywords = optionKeywords ?? [
        bgm.title,
        ...Object.values(bgm.titleTranslate).flat()
      ];
      option.beginDate = subMonths(new Date(bgm.begin), 1);
      const res = await search(anime, keywords, option);
      if (res) animes.push(res);
      break;
    }
  }

  // Fallback to manually specify
  if (!found && option.title) {
    const anime = Anime.empty(option.title, bgmId);
    const keywords = [...(optionKeywords ?? []), option.title];
    const res = await search(anime, keywords, option);
    if (res) animes.push(res);
  }

  if (option.plan) {
    outputPlan(animes);
  }
}

export async function search(
  anime: Anime,
  keywords: string[],
  option: SearchOption = { type: 'tv' }
) {
  info();
  info(lightGreen(anime.title) + ' ' + `(${bangumiLink(anime.bgmId)})`);

  const result = await context.database.search(keywords, {
    limit: option.beginDate,
    listener: IndexListener
  });

  if (option.raw) {
    result.sort((a, b) => a.title.localeCompare(b.title));
    for (const item of result) {
      info(
        `   ${link(item.title, context.database.formatMagnetLink(item.link))}`
      );
    }
    return;
  }

  anime.addSearchResult(result);
  await context.updateAnime(anime);

  const map = groupBy(anime.episodes, (ep) => ep.fansub);
  for (const [key, eps] of map) {
    info('  ' + bold(key));
    eps.sort((a, b) => a.ep - b.ep);
    for (const ep of eps) {
      info(
        `   ${dim(formatEP(ep.ep))} ${link(
          ep.magnetName,
          context.database.formatMagnetLink(ep.magnetId)
        )}`
      );
    }
  }

  return anime;
}

function outputPlan(animes: Anime[]) {
  console.log();
  console.log(`  onair:`);
  for (const anime of animes) {
    console.log(`    - name: ${anime.title}`);
    console.log(`      bgmId: '${anime.bgmId}'`);
    console.log(`      fansub:`);
    const map = groupBy(anime.episodes, (ep) => ep.fansub);
    for (const [key] of map) {
      console.log(`        - ${key}`);
    }
  }
}

async function promptSearch(anime: string | undefined, option: SearchOption) {
  if (anime) {
    const bgms = await searchInBgmdata(anime, option);
    return await promptBgm(bgms);
  } else {
    const year = new Date().getFullYear();
    await prompts([
      {
        type: option.year ? null : 'select',
        name: 'year',
        message: '年份?',
        choices: new Array(5).fill(undefined).map((_v, i) => ({
          title: String(year - i) + ' 年',
          value: String(year - i)
        })),
        initial: 0,
        onState({ value }) {
          option.year = value;
        }
      },
      {
        type: option.month ? null : 'select',
        name: 'month',
        message: '季度?',
        choices: [
          { title: '1 月', value: '1' },
          { title: '4 月', value: '4' },
          { title: '7 月', value: '7' },
          { title: '10 月', value: '10' }
        ],
        initial: 0,
        onState({ value }) {
          option.month = value;
        }
      }
    ]);
    const { items } = await importBgmdata(option);
    return await promptBgm(items, false);
  }
}

async function promptBgm(bgms: Item[], enableDate = true): Promise<Item[]> {
  const { value: bgm } = await prompts({
    type: 'multiselect',
    name: 'value',
    message: '动画?',
    choices: bgms.map((bgm) => {
      const d = getBgmDate(bgm);
      return {
        title: getBgmTitle(bgm) + (enableDate ? ` (${d.year}-${d.month})` : ''),
        value: bgm as unknown as any
      };
    }),
    hint: '- Space to select, Return to submit',
    // @ts-ignore
    instructions: false
  });
  return bgm ?? [];
}

export async function searchInBgmdata(
  name: string,
  option: SearchOption,
  length = 5
) {
  const { items } = await importBgmdata(option);

  const include: Item[] = [];
  const similar: Array<{ item: Item; dis: number }> = [];

  for (const item of items) {
    const titles = [item.title, ...Object.values(item.titleTranslate).flat()];
    let included = false;
    let dis = Number.MAX_SAFE_INTEGER;
    for (const title of titles) {
      const d = distance(name, title);
      if (d === Math.abs(title.length - name.length)) {
        included = true;
      }
      dis = Math.min(dis, d);
    }
    if (included) {
      include.push(item);
      if (include.length >= length) {
        return include;
      }
    }
    if (similar.length < length) {
      similar.push({ item, dis });
    } else {
      let mxId = 0;
      for (let i = 1; i < similar.length; i++) {
        if (similar[i].dis > similar[mxId].dis) {
          mxId = i;
        }
      }
      if (similar[mxId].dis > dis) {
        similar.splice(mxId);
        similar.push({ item, dis });
      }
    }
  }
  if (include.length > 0) {
    return include;
  } else {
    return similar.map(({ item }) => item);
  }
}

export async function importBgmdata(
  option: SearchOption = { type: 'tv' }
): Promise<{ items: Item[]; siteMeta: Record<string, SiteMeta> }> {
  const { items, siteMeta } = require('bangumi-data');
  debug('Load Bangumi-data OK');
  return {
    items: items.filter((bgm: Item) => {
      const d = getBgmDate(bgm);
      if (option.year && +option.year !== d.year) return false;
      if (option.month && +option.month !== d.month) return false;
      return bgm.type === option.type;
    }),
    siteMeta
  };
}
