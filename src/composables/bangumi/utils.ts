import type { Item, Language } from 'bangumi-data';

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

export function sleep(second = 1): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), second * 1000);
  });
}
