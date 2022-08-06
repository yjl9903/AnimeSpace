import type { Item, Language } from 'bangumi-data';

export * from './compress';

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

export function getBgmTitle(bgm: Item, locale: Language = 'zh-Hans') {
  return bgm.titleTranslate[locale]?.[0] ?? bgm.title;
}

export function getBgmLink(bgmId: string) {
  return 'https://bangumi.tv/subject/' + bgmId;
}
