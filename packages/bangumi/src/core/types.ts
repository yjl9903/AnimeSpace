import type { Language } from 'bangumi-data';

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
}

export interface RawExportData {
  compress: boolean;

  bangumis: Array<BaseBangumi & Partial<ExtendBangumi>>;
}
