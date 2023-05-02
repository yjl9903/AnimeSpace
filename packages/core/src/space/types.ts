import type { Plugin } from '../plugin';

export interface RawAnimeSpace {
  readonly root: string;

  readonly storage: string;

  readonly preference: Preference;

  readonly plans: string[];

  readonly plugins: PluginEntry[];
}

export interface AnimeSpace {
  readonly root: string;

  readonly storage: string;

  readonly preference: Preference;

  readonly plans: () => Promise<Plan[]>;

  readonly plugins: Plugin[];

  readonly resolvePath: (...d: string[]) => string;
}

export interface Preference {
  readonly format: {
    readonly anime: string;
    readonly episode: string;
    readonly film: string;
    readonly ova: string;
  };
  readonly extension: {
    readonly include: string[];
    readonly exclude: string[];
  };
  readonly keyword: {
    readonly order: Record<string, string[]>;
    readonly exclude: string[];
  };
  readonly fansub: {
    readonly order: string[];
    readonly exclude: string[];
  };
}

export interface PluginEntry extends Record<string, any> {
  name: string;
}

export type PlanState = 'onair' | 'finish';

export type AnimePlanType = '番剧' | '电影' | 'OVA';

export interface Plan {
  readonly name: string;

  readonly date: Date;

  readonly state: PlanState;

  readonly onair: AnimePlan[];
}

export interface AnimePlan {
  readonly title: string;

  readonly translations: Record<string, string[]>;

  readonly type: AnimePlanType;

  readonly state: PlanState;

  readonly bgmId: string;

  readonly season: number;

  readonly date: Date;

  readonly keywords: KeywordsParams;
}

export interface KeywordsParams {
  readonly include: string[][];
  readonly exclude: string[];
}
