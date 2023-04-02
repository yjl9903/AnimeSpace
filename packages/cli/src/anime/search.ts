import { createRequire } from 'node:module';

import prompts from 'prompts';
import createDebug from 'debug';
import { distance } from 'fastest-levenshtein';
import { link, bold, dim } from '@breadc/color';
import { format, subMonths } from 'date-fns';

import type { BaseBangumi, ExtendBangumi } from '@animepaste/bangumi';

import type { CustomBangumi, AnimeType } from '../types';

import { context } from '../context';
import { filterDef, groupBy, formatEP } from '../utils';
import {
  logger,
  IndexListener,
  printMagnets,
  okColor,
  titleColor
} from '../logger';

import { bangumiLink } from './utils';

interface SearchOption {
  type: AnimeType;
  raw?: boolean;
  plan?: boolean;
  year?: string;
  month?: string;
  title?: string;
  fansub?: string[];

  log?: boolean;

  // Filter outdated resources with same name
  beginDate?: Date;
}

const debug = createDebug('anime:search');

function getDefaultKeywords(bgm: CustomBangumi) {
  return filterDef([
    bgm.title,
    ...Object.values(bgm.titleTranslate).flat(),
    bgm.dmhy
  ]);
}

export async function userSearch(
  anime: string | undefined,
  option: SearchOption
) {
  const bgms = await promptSearch(anime, option);
  for (const bgm of bgms) {
    const keywords = getDefaultKeywords(bgm);
    option.beginDate = subMonths(new Date(bgm.begin), 1);
    await search(bgm, keywords, option);
  }
  if (option.plan && bgms.length > 0) {
    await outputPlan(bgms);
  }
}

export async function daemonSearch(
  bgmId: string,
  optionKeywords?: string[],
  option: SearchOption = { type: 'tv' }
) {
  const items = await importBgmdata();

  let found = false;
  for (const bgm of items) {
    if (bgmId === bgm.bgmId) {
      found = true;
      const keywords = optionKeywords ?? getDefaultKeywords(bgm);
      option.beginDate = subMonths(new Date(bgm.begin), 1);
      await search(bgm, keywords, option);

      if (option.plan) {
        await outputPlan([bgm]);
      }

      break;
    }
  }

  // Fallback to bgm.tv
  if (!found) {
    const keywords = [...(optionKeywords ?? [])];
    if (option.title && !option.plan) {
      await search({ bgmId, titleCN: option.title }, keywords, option);
    } else if (!option.title) {
      debug(`Fallback to search ${bgmId} on bgm.tv`);

      const { BgmClient } = await import('@animepaste/bangumi/bgm');
      const client = new BgmClient();
      client.setupUserAgent();

      const bgm = await client.fetchSubject(bgmId);
      keywords.push(bgm.title, bgm.titleCN);

      await search(bgm, keywords, option);

      if (option.plan) {
        await outputPlan([bgm]);
      }
    }
  }
}

export async function search(
  bgm: { bgmId: string; titleCN: string },
  keywords: string[],
  option: SearchOption = { type: 'tv' }
) {
  if (option.title) {
    keywords = [...keywords];
    keywords.push(option.title);
  }

  const log = option.log ?? true;

  if (log) {
    logger.empty();
    logger.info(
      okColor('Refresh  ') +
        titleColor(bgm.titleCN) +
        '    ' +
        `(${bangumiLink(bgm.bgmId)})`
    );
  }

  debug(`Search "${bgm.titleCN}"`);
  for (const keyword of keywords) {
    debug('- ' + keyword);
  }

  const result = await context.magnetStore.search(keywords, {
    limit: option.beginDate,
    listener: IndexListener,
    Episode: true
  });
  for (const resource of result) {
    // Disable download MKV
    if (resource.title.indexOf('MKV') !== -1) continue;
    // Disable download HEVC
    if (resource.title.indexOf('HEVC') !== -1) continue;

    if (!resource.Episode) {
      await context.episodeStore.createEpisode(bgm.bgmId, resource);
    }
  }

  if (option.raw) {
    printMagnets(result);
  } else if (log) {
    const episodes = await context.episodeStore.listEpisodes(bgm.bgmId);
    const map = groupBy(episodes, (ep) => ep.fansub);
    for (const [key, eps] of map) {
      logger.tab.info(bold(key));
      eps.sort((a, b) => a.ep - b.ep);
      for (const ep of eps) {
        logger.tab.tab.info(
          `${dim(formatEP(ep.ep))} ${link(
            ep.magnet.title,
            context.magnetStore.idToLink(ep.magnet.id)
          )}`
        );
      }
    }
  }
}

async function outputPlan(
  animes: (BaseBangumi & Pick<ExtendBangumi, 'titleCN' | 'begin'>)[]
) {
  const date = new Date(
    Math.min(...animes.map((a) => new Date(a.begin).getTime()))
  );

  logger.empty();
  logger.println(`--- ${format(new Date(), 'yyyy-MM-dd 新番放送计划')} ---`);
  logger.empty();
  logger.println(`name: ${format(new Date(), 'yyyy-MM-dd 新番放送计划')}`);
  logger.empty();
  logger.println(`date: ${format(date, 'yyyy-MM-dd HH:mm')}`);
  logger.empty();
  logger.println(`state: onair`);
  logger.empty();
  logger.println(`sync: true`);
  logger.empty();
  logger.println(`onair:`);

  for (const anime of animes) {
    const episodes = await context.episodeStore.listEpisodes(anime.bgmId);

    logger.tab.println(`- title: ${anime.titleCN}`);
    logger.tab.println(`  bgmId: '${anime.bgmId}'`);
    logger.tab.println(`  fansub:`);

    const map = groupBy(episodes, (ep) => ep.fansub);
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

async function searchInBgmdata(name: string, option: SearchOption, length = 5) {
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

async function importBgmdata(
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
