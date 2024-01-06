import { z } from 'zod';

import { StringArray } from '../utils';

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
              fansub: undefined
            })),
            z.object({
              offset: z.coerce.number(),
              fansub: StringArray.optional()
            })
          ])
          .optional(),
        season: z.number().optional()
      })
      .passthrough()
      .optional(),
    fansub: StringArray.default([]),
    keywords: z.any()
  })
  .passthrough();

export const PlanSchema = z.object({
  name: z.string().default('unknown'),
  date: z.coerce.date(),
  status: z.enum(['onair', 'finish']).default('onair'),
  onair: z.array(AnimePlanSchema).default([])
});
