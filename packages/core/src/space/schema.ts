import { z } from 'zod';

import type { Plugin } from '../plugin';

import { StringArray } from '../utils';

import {
  DefaultAnimeFormat,
  DefaultEpisodeFormat,
  DefaultFilmFormat,
  DefaultStorageDirectory
} from './constant';

export const PluginEntry = z.object({ name: z.string() }).passthrough();

export interface PluginEntry extends Record<string, any> {
  name: string;
}

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
  plugins: z.array(PluginEntry)
});

export type RawAnimeSpace = z.infer<typeof RawAnimeSpaceSchema>;

export interface AnimeSpace {
  readonly root: string;

  readonly storage: string;

  readonly preference: Preference;

  readonly plugins: Plugin[];

  readonly plans: () => Promise<Plan[]>;

  readonly resolvePath: (...d: string[]) => string;
}

export type PlanStatus = 'onair' | 'finish';

export type AnimePlanType = '番剧' | '电影' | 'OVA';

export const AnimePlanSchema = z
  .object({
    title: z.string(),
    translations: z
      .union([
        z.string().transform(s => ({ unknown: [s] })),
        z.array(z.string()).transform(arr => ({ unknown: arr })),
        z.record(z.string(), StringArray)
      ])
      .default({}),
    directory: z.string().optional(),
    type: z.enum(['番剧', '电影', 'OVA']).default('番剧'),
    status: z.enum(['onair', 'finish']).optional(),
    season: z.coerce.number().optional(),
    date: z.coerce.date().optional(),
    rewrite: z
      .object({
        episode: z.number().optional()
      })
      .passthrough()
      .optional(),
    keywords: z.any()
  })
  .passthrough();

export const PlanSchema = z.object({
  name: z.string().default('unknown'),
  date: z.coerce.date(),
  status: z.enum(['onair', 'finish']).default('onair'),
  onair: z.array(AnimePlanSchema).default([])
});

export interface Plan {
  readonly name: string;

  readonly date: Date;

  readonly status: PlanStatus;

  readonly onair: AnimePlan[];
}

export interface AnimePlan {
  readonly title: string;

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

  /**
   * Rewrite the inferred things
   */
  readonly rewrite?: {
    readonly episode?: number | { offset: number; gte?: number; lte?: number };
  };
}

export interface KeywordsParams {
  readonly include: string[][];
  readonly exclude: string[];
}
