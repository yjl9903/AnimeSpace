export type PlanStatus = 'onair' | 'finish';

export type AnimePlanType = '番剧' | '电影' | 'OVA';

export interface PlanFile {
  readonly name: string;

  readonly date: Date;

  readonly status: PlanStatus;

  readonly onair: AnimePlan[];
}

export interface AnimePlan {
  readonly title: string;

  readonly alias: string[];

  /**
   * Translation names, which will generate the search keywords
   */
  readonly translations: Record<string, string[]>;

  /**
   * The anime library directory which can overwrite the default title.
   *
   * It will help animes with multiple seasons.
   *
   * This should be relative to the storage directory
   */
  readonly directory?: string;

  readonly type: AnimePlanType;

  readonly status: PlanStatus;

  readonly season?: number;

  readonly date: Date;

  /**
   * Overwrite the generated search keywords
   */
  readonly keywords: KeywordsParams;

  readonly fansub: string[];

  /**
   * Rewrite the inferred things
   */
  readonly rewrite?: {
    readonly title?: string;

    readonly episode?: { offset: number; fansub?: string[] };
  };
}

export interface KeywordsParams {
  readonly include: string[][];

  readonly exclude: string[];
}
