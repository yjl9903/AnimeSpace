import type { Item, Language } from 'bangumi-data';

import { link } from 'kolorist';

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

export function getBgmDmhy(bgm: Item) {
  for (const site of bgm.sites) {
    if (site.site === 'dmhy') {
      return site.id;
    }
  }
}

export function bangumiLink(bgmId: string) {
  return link(`Bangumi: ${bgmId}`, 'https://bangumi.tv/subject/' + bgmId);
}

export function formatEP(ep: number, fill = '0') {
  return `${ep < 10 ? fill : ''}${ep}`;
}
