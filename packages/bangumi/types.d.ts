import type { BangumiType, BaseBangumi, ExtendBangumi } from './dist';

export type BangumiType = BangumiType;

export type BaseBangumi = BaseBangumi;

export type ExtendBangumi = ExtendBangumi;

export const compress: boolean;

export const bangumis: Array<
  BaseBangumi & Pick<ExtendBangumi, 'titleCN' | 'begin'>
>;
