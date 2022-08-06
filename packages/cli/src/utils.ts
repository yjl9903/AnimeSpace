import { ImmutableMap, MutableMap } from 'lbear';

export function formatEP(ep: number, fill = '0') {
  return `${ep < 10 ? fill : ''}${ep}`;
}

export function filterDef<T>(items: (T | undefined | null)[]): T[] {
  return items.filter(Boolean) as T[];
}

export function groupBy<T>(
  items: T[],
  fn: (arg: T) => string
): ImmutableMap<string, T[]> {
  const map = MutableMap.empty<string, T[]>();
  for (const item of items) {
    const key = fn(item);
    map.getOrPut(key, () => []).push(item);
  }
  return map.toImmutable();
}
