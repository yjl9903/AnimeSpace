import type {
  BangumiType,
  BaseBangumi,
  ExtendBangumi,
  ExtendBangumiSubject
} from './dist';

export type BangumiType = BangumiType;

export type BaseBangumi = BaseBangumi;

export type ExtendBangumi = ExtendBangumi;

export type ExtendBangumiSubject = ExtendBangumiSubject;

export const bangumis: Array<
  BaseBangumi & Pick<ExtendBangumi, 'titleCN' | 'begin'>
>;
