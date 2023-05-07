export * from './fs';

export * from './use';

export * from './format';

export * from './signal';

export function uniqBy<T>(arr: T[], map: (el: T) => string): T[] {
  const set = new Set();
  const list: T[] = [];
  for (const item of arr) {
    const key = map(item);
    if (!set.has(key)) {
      set.add(key);
      list.push(item);
    }
  }
  return list;
}
