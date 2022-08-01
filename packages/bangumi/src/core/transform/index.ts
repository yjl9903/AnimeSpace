import type { Item } from 'bangumi-data';

import type { BangumiExtension } from '../types';

export interface TransformOption {
  range?: {
    begin?: Date;

    end?: Date;
  };

  compress?: boolean;

  fields?: Array<keyof BangumiExtension>;
}

export async function transform(option: TransformOption) {
  const data = importBangumiData();
  if (!data) {
    throw new Error('Fail importing bangumi-data');
  }
  return;
}

async function importBangumiData() {
  try {
    return (await import('bangumi-data')).default;
  } catch {
    return undefined;
  }
}
