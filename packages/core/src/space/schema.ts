import { z } from 'zod';

import type { Plugin } from '../plugin';
import {
  DefaultAnimeFormat,
  DefaultEpisodeFormat,
  DefaultFilmFormat,
  DefaultStorageDirectory
} from './constant';

export const StringArray = z.union([
  z.string().transform((s) => [s]),
  z.string().array()
]);

export type StringArray = z.infer<typeof StringArray>;

export const PluginEntry = z.object({ name: z.string() });

export type PluginEntry = z.infer<typeof PluginEntry>;

export const Preference = z.object({
  format: z.object({
    anime: z.string().default(DefaultAnimeFormat),
    episode: z.string().default(DefaultEpisodeFormat),
    film: z.string().default(DefaultFilmFormat),
    ova: z.string().default(DefaultFilmFormat)
  }),
  extension: z.object({
    include: z.array(z.string()).default(['mp4', 'mkv']),
    exclude: z.array(z.string())
  }),
  keyword: z.object({
    order: z.record(z.string(), z.array(z.string())),
    exclude: z.array(z.string())
  }),
  fansub: z.object({
    order: StringArray,
    exclude: z.array(z.string())
  })
});

export type Preference = z.infer<typeof Preference>;

export const RawAnimeSpaceSchema = z.object({
  storage: z.string().default(DefaultStorageDirectory),
  preference: Preference.passthrough(),
  plans: StringArray,
  plugins: z.array(PluginEntry.passthrough())
});

export type RawAnimeSpace = z.infer<typeof RawAnimeSpaceSchema>;

export interface AnimeSpace {
  readonly root: string;

  readonly storage: string;

  readonly preference: Preference;

  readonly plans: () => Promise<Plan[]>;

  readonly plugins: Plugin[];

  readonly resolvePath: (...d: string[]) => string;
}

export type PlanStatus = 'onair' | 'finish';

export type AnimePlanType = '番剧' | '电影' | 'OVA';

export interface Plan {
  readonly name: string;

  readonly date: Date;

  readonly status: PlanStatus;

  readonly onair: AnimePlan[];
}

export interface AnimePlan {
  readonly title: string;

  readonly translations: Record<string, string[]>;

  readonly type: AnimePlanType;

  readonly status: PlanStatus;

  readonly bgm: string;

  readonly season: number;

  readonly date: Date;

  readonly keywords: KeywordsParams;
}

export interface KeywordsParams {
  readonly include: string[][];
  readonly exclude: string[];
}
