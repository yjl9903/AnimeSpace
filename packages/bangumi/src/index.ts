import type { BaseBangumi, ExtendBangumi } from './core/types';

import { load } from './core/load';

export * from './core/types';

export type DefaultBangumi = BaseBangumi &
  Pick<ExtendBangumi, 'titleCN' | 'begin'>;

const data = load('data.json');

export const bangumis = data.bangumis;

export { load };
