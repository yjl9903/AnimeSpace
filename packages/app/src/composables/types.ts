import type {
  BaseBangumi,
  ExtendBangumi,
  ExtendBangumiSubject
} from '@animepaste/bangumi';

export type Bangumi = BaseBangumi &
  Pick<ExtendBangumi, 'titleCN' | 'begin' | 'officialSite'> &
  Partial<ExtendBangumiSubject>;

export type SubjectBangumi = BaseBangumi &
  Pick<ExtendBangumi, 'titleCN' | 'begin' | 'officialSite'> &
  ExtendBangumiSubject;
