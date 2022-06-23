import type { Item } from 'bangumi-data';
import { debug as createDebug } from 'debug';
import { distance } from 'fastest-levenshtein';

import type { AnimeType } from '../types';

import { findResources } from './resources';

interface SearchOption {
  type: AnimeType;
  year?: string;
  month?: string;
}

const debug = createDebug('anime:search');

export async function search(anime: string | undefined, option: SearchOption) {
  if (anime) {
    const bgm = await searchInBgmdata(anime);
    for (const item of bgm) {
      console.log(item.title);
    }
  } else {
  }
}

export async function searchInBgmdata(name: string, length = 5) {
  const { items } = await importBgmdata();

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

export async function importBgmdata() {
  const { items, siteMeta } = await import('bangumi-data');
  debug('Load Bangumi-data OK');
  return { items, siteMeta };
}
