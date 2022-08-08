import { createRequire } from 'node:module';

import type { Item } from 'bangumi-data';

import createDebug from 'debug';

import type { BaseBangumi, BangumiType, ExtendBangumi } from '../types';

import { compress, getBgmDmhy, getBgmId, getBgmTitle } from '../utils';

const debug = createDebug('bangumi:transform');

export interface TransformOption {
  begin?: string | number | Date;

  end?: string | number | Date;

  type?: BangumiType | BangumiType[];

  compress?: boolean;

  fields?: Array<keyof ExtendBangumi>;
}

export async function transform(option: TransformOption = {}) {
  const data = await importBangumiData();
  if (!data) {
    throw new Error('Fail importing bangumi-data');
  }

  data.items = data.items.sort((lhs, rhs) => {
    const d1 = new Date(lhs.begin).getTime();
    const d2 = new Date(rhs.begin).getTime();
    return d1 - d2;
  });

  const begin = new Date(option.begin ?? 0);
  const end = option.end ? new Date(option.end) : new Date();
  const types =
    !!option.type && Array.isArray(option.type)
      ? option.type
      : !!option.type
      ? [option.type]
      : ['tv'];

  const bangumis: BaseBangumi[] = [];
  for (const item of data.items) {
    const date = new Date(item.begin);
    if (begin.getTime() <= date.getTime() && date.getTime() <= end.getTime()) {
      if (types.includes(item.type)) {
        const bgmId = getBgmId(item);
        if (!bgmId) {
          debug(`Missing bgmId of ${getBgmTitle(item)}`);
          continue;
        }

        const bangumi: BaseBangumi & Partial<ExtendBangumi> = {
          bgmId,
          title: item.title,
          type: item.type
        };
        for (const field of option.fields ?? []) {
          switch (field) {
            case 'titleCN': {
              bangumi.titleCN = getBgmTitle(item);
              break;
            }
            case 'titleTranslate': {
              bangumi.titleTranslate = item.titleTranslate;
              break;
            }
            case 'lang': {
              bangumi.lang = item.lang;
              break;
            }
            case 'officialSite': {
              bangumi.officialSite = item.officialSite;
              break;
            }
            case 'begin': {
              bangumi.begin = item.begin;
              break;
            }
            case 'end': {
              bangumi.end = item.end;
              break;
            }
            case 'comment': {
              bangumi.comment = item.comment;
              break;
            }
            case 'dmhy': {
              bangumi.dmhy = getBgmDmhy(item);
              break;
            }
            default: {
              debug(`Unknown bangumi extension field: ${field}`);
            }
          }
        }
        bangumis.push(bangumi);
      }
    }
  }

  const shouldCompress = option.compress ?? true;

  return compress({
    compress: shouldCompress,
    bangumis
  });
}

async function importBangumiData(): Promise<{ items: Item[] } | undefined> {
  try {
    const require = createRequire(import.meta.url);
    const data = require('bangumi-data');
    return 'default' in data ? data.default : data;
  } catch (err) {
    debug(err);
    return undefined;
  }
}
