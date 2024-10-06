import type { StoragePath } from '../space';
import type { Preference } from '../space/schema';

export type PlanStatus = 'onair' | 'finish';

export type AnimePlanType = '番剧' | '电影' | 'OVA';

export interface PlanFile {
  readonly name: string;

  readonly date: Date;

  readonly status: PlanStatus;

  readonly preference: Preference;

  readonly onair: AnimePlan[];
}

export interface AnimePlan {
  readonly title: string;

  /**
   * Alias names
   */
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

  /**
   * The storage file system root
   */
  readonly storage: {
    name: string;

    root: StoragePath;
  };

  readonly type: AnimePlanType;

  readonly status: PlanStatus;

  readonly season: number;

  /**
   * Rewrite the inferred things
   */
  readonly rewrite?: {
    readonly title?: string;

    readonly episode?: { offset: number; fansub?: string[] };

    readonly season?: number;
  };

  /**
   * Public date, which may inherit plan date
   */
  readonly date: Date;

  /**
   * Overwrite the generated search keywords
   */
  readonly keywords: KeywordsParams;

  /**
   * Prefer fansub list
   */
  readonly fansub: string[];

  readonly preference: Preference;
}

export interface KeywordsParams {
  readonly include: string[];

  readonly exclude: string[];
}
