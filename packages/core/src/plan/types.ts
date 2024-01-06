import { z } from 'zod';

import { StringArray } from '../utils';

export type PlanStatus = 'onair' | 'finish';

export type AnimePlanType = '番剧' | '电影' | 'OVA';

export const AnimePlanSchema = z
  .object({
    title: z.string(),
    alias: z.array(z.string()).default([]),
    translations: z
      .union([
        z.string().transform((s) => ({ unknown: [s] })),
        z.array(z.string()).transform((arr) => ({ unknown: arr })),
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
        title: z.string().optional(),
        episode: z
          .union([
            z.coerce.number().transform((n) => ({
              offset: n,
              gte: Number.MIN_SAFE_INTEGER,
              lte: Number.MAX_SAFE_INTEGER
            })),
            z.object({
              offset: z.coerce.number(),
              gte: z.coerce.number().default(Number.MIN_SAFE_INTEGER),
              lte: z.coerce.number().default(Number.MAX_SAFE_INTEGER)
            })
          ])
          .optional(),
        season: z.number().optional()
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

  /**
   * Rewrite the inferred things
   */
  readonly rewrite?: {
    readonly title?: string;

    readonly episode?: { offset: number; gte: number; lte: number };
  };
}

export interface KeywordsParams {
  readonly include: string[][];

  readonly exclude: string[];
}
