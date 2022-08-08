import type { Language } from 'bangumi-data';

import type { Images, InfoBox, Rating, Tag } from './bgm';

export type BangumiType = 'tv' | 'web' | 'movie' | 'ova';

export interface BaseBangumi {
  bgmId: string;

  title: string;

  type: BangumiType;
}

export interface ExtendBangumi {
  titleCN: string;

  titleTranslate: Record<Language, string[]>;

  lang: Language;

  officialSite: string;

  /**
   * tv/web: 番组开始时间;
   * movie: 上映日期;
   * ova: 首话发售时间.
   */
  begin: string;

  /**
   * tv/web: 番组完结时间;
   * movie: 无意义;
   * ova: 则为最终话发售时间（未确定则置空）.
   */
  end?: string;

  comment?: string;

  dmhy?: string;
}

export interface ExtendBangumiSubject {
  bgm: BangumiSubject;
}

export interface BangumiSubject {
  summary: string;

  images: Images;

  eps: number;

  rating: Rating;

  subject?: {
    infobox: InfoBox[];

    tags: Tag[];
  };
}

export interface RawExportData {
  compress: boolean;

  bangumis: Array<BaseBangumi & Partial<ExtendBangumi>>;
}

export interface Calendar {
  weekday: {
    en: string;
    cn: string;
    ja: string;
    id: number;
  };

  bangumis: Array<BaseBangumi & ExtendBangumiSubject>;
}
