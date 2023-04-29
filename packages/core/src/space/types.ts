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
}

export interface Preference {
  format: {
    include: string[];
    exclude: string[];
  };
  keyword: {
    order: Record<string, string[]>;
    exclude: string[];
  };
  fansub: {
    order: string[];
    exclude: string[];
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

  readonly type: AnimePlanType;

  readonly bgmId: string;

  readonly season: number;
}
