import type { Item } from 'bangumi-data';

import prompts from 'prompts';
import { link, bold, dim, lightGreen } from 'kolorist';
import { debug as createDebug } from 'debug';
import { distance } from 'fastest-levenshtein';

import type { AnimeType } from '../types';
import { context } from '../context';
import { bangumiLink } from '../utils';

import { Anime } from './anime';
import { findResources, formatMagnetURL } from './resources';
import { getBgmDate, getBgmTitle, getBgmId, groupBy } from './utils';

interface SearchOption {
  type: AnimeType;
  year?: string;
  month?: string;
}

const debug = createDebug('anime:search');

export async function userSearch(
  anime: string | undefined,
  option: SearchOption
) {
  const bgms = await promptSearch(anime, option);
  for (const bgm of bgms) {
    const anime =
      (await context.getAnime(getBgmId(bgm)!)) ?? Anime.bangumi(bgm);
    const keywords = [bgm.title, ...Object.values(bgm.titleTranslate).flat()];
    await search(anime, keywords);
  }
}

export async function daemonSearch(bgmId: string) {
  const { items } = await importBgmdata();
  for (const bgm of items) {
    if (bgmId === getBgmId(bgm)) {
      const anime =
        (await context.getAnime(getBgmId(bgm)!)) ?? Anime.bangumi(bgm);
      const keywords = [bgm.title, ...Object.values(bgm.titleTranslate).flat()];
      await search(anime, keywords);
    }
  }
}

export async function search(anime: Anime, keywords: string[]) {
  console.log();
  console.log(
    '  ' + lightGreen(anime.title) + ' ' + `(${bangumiLink(anime.bgmId)})`
  );

  const result = await findResources(keywords);

  anime.addSearchResult(result);
  await context.updateAnime(anime);

  const map = groupBy(anime.episodes, (ep) => ep.fansub);
  for (const [key, eps] of map) {
    console.log();
    console.log('    ' + bold(key));
    eps.sort((a, b) => a.ep - b.ep);
    for (const ep of eps) {
      console.log(
        `     ${ep.ep < 10 ? ' ' : ''}${dim(ep.ep)} ${link(
          ep.magnetName,
          formatMagnetURL(ep.magnetId)
        )}`
      );
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
          value: year - i
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
          { title: '1 月', value: 1 },
          { title: '4 月', value: 4 },
          { title: '7 月', value: 7 },
          { title: '10 月', value: 10 }
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
        value: bgm
      };
    }),
    hint: '- Space to select, Return to submit',
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

export async function importBgmdata(option: SearchOption = { type: 'tv' }) {
  const { items, siteMeta } = await import('bangumi-data');
  debug('Load Bangumi-data OK');
  return {
    items: items.filter((bgm) => {
      const d = getBgmDate(bgm);
      if (option.year && +option.year !== d.year) return false;
      if (option.month && +option.month !== d.month) return false;
      return bgm.type === option.type;
    }),
    siteMeta
  };
}
