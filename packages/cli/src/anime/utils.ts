import type { Item } from 'bangumi-data';

export function getBgmDate(bgm: Item) {
  const d = new Date(bgm.begin);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    date: d.getDate(),
    weekday: d.getDay()
  };
}
