import { createRequire } from 'node:module';

import prompts from 'prompts';
import { distance } from 'fastest-levenshtein';
import { format, subMonths } from 'date-fns';
import { debug as createDebug } from 'debug';
import { link, bold, dim, lightGreen } from 'kolorist';

import type { CustomBangumi, AnimeType } from '../types';

import { context } from '../context';
import { filterDef, groupBy, formatEP } from '../utils';
import { logger, IndexListener, printMagnets } from '../logger';

import { Anime } from './anime';
import { bangumiLink } from './utils';

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

function getDefaultKeywords(bgm: CustomBangumi) {
  return filterDef([
    bgm.title,
    ...Object.values(bgm.titleTranslate).flat()
    // getBgmDmhy(bgm)
  ]);
}

export async function userSearch(
  anime: string | undefined,
  option: SearchOption
) {
  const bgms = await promptSearch(anime, option);
  const animes: Anime[] = [];
  for (const bgm of bgms) {
    const anime = (await context.getAnime(bgm.bgmId)) ?? Anime.bangumi(bgm);
    const keywords = getDefaultKeywords(bgm);
    option.beginDate = subMonths(new Date(bgm.begin), 1);
    const res = await search(anime, keywords, option);
    if (res) animes.push(res);
  }
  if (option.plan && animes.length > 0) {
    outputPlan(animes);
  }
}

export async function daemonSearch(
  bgmId: string,
  optionKeywords?: string[],
  option: SearchOption = { type: 'tv' }
) {
  const items = await importBgmdata();
  const animes: Anime[] = [];
  let found = false;
  for (const bgm of items) {
    if (bgmId === bgm.bgmId) {
      found = true;
      const anime = (await context.getAnime(bgm.bgmId)) ?? Anime.bangumi(bgm);
      const keywords = optionKeywords ?? getDefaultKeywords(bgm);
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
  logger.empty();
  logger.info(lightGreen(anime.title) + ' ' + `(${bangumiLink(anime.bgmId)})`);

  debug(`Search "${anime.title}"`);
  for (const keyword of keywords) {
    debug('- ' + keyword);
  }

  const result = await context.magnetStore.search(keywords, {
    limit: option.beginDate,
    listener: IndexListener
  });

  if (option.raw) {
    printMagnets(result);
    return;
  }

  anime.addSearchResult(result);
  await context.updateAnime(anime);

  const map = groupBy(anime.episodes, (ep) => ep.fansub);
  for (const [key, eps] of map) {
    logger.tab.info(bold(key));
    eps.sort((a, b) => a.ep - b.ep);
    for (const ep of eps) {
      logger.tab.tab.info(
        `${dim(formatEP(ep.ep))} ${link(
          ep.magnetName,
          context.magnetStore.idToLink(ep.magnetId)
        )}`
      );
    }
  }

  return anime;
}

function outputPlan(animes: Anime[]) {
  const date = new Date(Math.min(...animes.map((a) => a.date.getTime())));

  logger.empty();
  logger.println(`--- ${format(new Date(), 'yyyy-MM-dd 新番放送计划')} ---`);
  logger.empty();
  logger.println(`name: ${format(new Date(), 'yyyy-MM-dd 新番放送计划')}`);
  logger.empty();
  logger.println(`date: ${format(date, 'yyyy-MM-dd HH:mm')}`);
  logger.empty();
  logger.println(`state: onair`);
  logger.empty();
  logger.println(`onair:`);
  for (const anime of animes) {
    logger.tab.println(`- title: ${anime.title}`);
    logger.tab.println(`  bgmId: '${anime.bgmId}'`);
    logger.tab.println(`  fansub:`);
    const map = groupBy(anime.episodes, (ep) => ep.fansub);
    for (const [key] of map) {
      logger.tab.tab.println(`  - ${key}`);
    }
    logger.empty();
  }
}

async function promptSearch(anime: string | undefined, option: SearchOption) {
  if (anime) {
    const bgms = await searchInBgmdata(anime, option);
    return await promptBgm(bgms);
  } else {
    const year = new Date().getFullYear();
    await prompts(
      [
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
      ],
      {
        onCancel: () => {
          throw new Error('Operation cancelled');
        }
      }
    );
    const items = await importBgmdata(option);
    return await promptBgm(items, false);
  }
}

async function promptBgm(
  bgms: CustomBangumi[],
  enableDate = true
): Promise<CustomBangumi[]> {
  const { value: bgm } = await prompts({
    type: 'multiselect',
    name: 'value',
    message: '动画?',
    choices: bgms.map((bgm) => {
      const d = getBgmDate(bgm);
      return {
        title: bgm.titleCN + (enableDate ? ` (${d.year}-${d.month})` : ''),
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
  const items = await importBgmdata(option);

  const include: CustomBangumi[] = [];
  const similar: Array<{ item: CustomBangumi; dis: number }> = [];

  for (const item of items) {
    const titles = getDefaultKeywords(item);

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
): Promise<CustomBangumi[]> {
  const require = createRequire(import.meta.url);
  const { load } = require('@animepaste/bangumi');
  const bangumis: CustomBangumi[] = load('cli-data.json').bangumis;
  debug('Load Bangumi data OK');
  return bangumis.filter((bgm: CustomBangumi) => {
    const d = getBgmDate(bgm);
    if (option.year && +option.year !== d.year) return false;
    if (option.month && +option.month !== d.month) return false;
    return bgm.type === option.type;
  });
}

function getBgmDate(bgm: CustomBangumi) {
  const d = new Date(bgm.begin);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    date: d.getDate(),
    weekday: d.getDay()
  };
}
