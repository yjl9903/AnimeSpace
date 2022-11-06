import type { Item, Language } from 'bangumi-data';

import type { SubjectBangumi } from '../types';

export function getBgmDate(bgm: Item) {
  const d = new Date(bgm.begin);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    date: d.getDate(),
    weekday: d.getDay()
  };
}

export function getBgmTitle(bgm: Item, locale: Language = 'zh-Hans') {
  return bgm.titleTranslate[locale]?.[0] ?? bgm.title;
}

export function getBgmId(bgm: Item) {
  for (const site of bgm.sites) {
    if (site.site === 'bangumi') {
      return site.id;
    }
  }
}

export function getCnTitle(bgm: { titleCN?: string; title: string }) {
  return Boolean(bgm.titleCN) ? bgm.titleCN : bgm.title;
}
