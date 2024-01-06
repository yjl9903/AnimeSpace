import fs from 'fs-extra';
import fg from 'fast-glob';
import path from 'pathe';
import { parse } from 'yaml';
import { AnyZodObject, z } from 'zod';

import type { AnimeSpace } from '../space';

import { AnimeSystemError, debug } from '../error';

import type { AnimePlan, KeywordsParams, PlanFile } from './types';
import { AnimePlanSchema, PlanSchema } from './schema';

export async function loadPlans(space: AnimeSpace) {
  const plans = await loadPlan(space);
  for (const plugin of space.plugins) {
    await plugin.prepare?.plans?.(space, plans);
  }
  return plans;
}

async function loadPlan(space: AnimeSpace): Promise<PlanFile[]> {
  const plugins = space.plugins;
  const animePlanSchema = plugins.reduce(
    (acc: AnyZodObject, plugin) => (plugin?.schema?.plan ? acc.merge(plugin?.schema?.plan) : acc),
    AnimePlanSchema
  ) as typeof AnimePlanSchema;
  const Schema = PlanSchema.extend({
    onair: z.array(animePlanSchema).default([])
  });

  const files = await fg(space.plans, { cwd: space.root.path, dot: true });

  const plans = await Promise.all(
    files.map(async (file) => {
      try {
        const content = await fs.readFile(path.resolve(space.root.path, file), 'utf-8');
        const yaml = parse(content);
        const parsed = Schema.safeParse(yaml);

        if (parsed.success) {
          const preference = {
            ...space.preference,
            ...parsed.data.preference
          };
          const plan: PlanFile = {
            ...parsed.data,
            preference,
            onair: parsed.data.onair.map(
              (o: z.infer<typeof AnimePlanSchema>) =>
                ({
                  ...o,
                  // Inherit plan status
                  status: o.status ? o.status : parsed.data.status,
                  // Inherit plan date
                  date: o.date ? o.date : parsed.data.date,
                  // Manually resolve keywords
                  keywords: resolveKeywordsArray(o.title, o.alias, o.translations, o.keywords),
                  // Inherit preference,
                  preference: {
                    ...preference,
                    ...o.preference
                  }
                }) as AnimePlan
            )
          };

          // debug(plan);

          return plan;
        } else {
          debug(parsed.error.issues);
          throw new AnimeSystemError(`解析 ${path.relative(space.root.path, file)} 失败`);
        }
      } catch (error) {
        if (error instanceof AnimeSystemError) {
          console.error(error);
        } else {
          debug(error);
          console.error(`解析 ${path.relative(space.root.path, file)} 失败`);
        }

        return undefined;
      }
    })
  );

  return plans.filter(Boolean) as PlanFile[];
}

function resolveKeywordsArray(
  title: string,
  alias: string[],
  translations: Record<string, string[]>,
  keywords: any
): KeywordsParams {
  const titles = [
    title,
    ...alias,
    ...Object.entries(translations).flatMap(([_key, value]) => value)
  ];
  if (keywords !== undefined && keywords !== null) {
    if (typeof keywords === 'string') {
      if (!keywords.startsWith('!')) {
        return { include: [titles, [keywords]], exclude: [] };
      } else {
        return { include: [titles], exclude: [keywords.slice(1)] };
      }
    } else if (Array.isArray(keywords)) {
      const include: string[][] = [titles];
      const exclude: string[] = [];
      for (const keyword of keywords) {
        if (typeof keyword === 'string') {
          if (!keyword.startsWith('!')) {
            include.push([keyword]);
          } else {
            exclude.push(keyword.slice(1));
          }
        } else if (Array.isArray(keyword)) {
          include.push(keyword);
        }
      }
      return { include, exclude };
    }
  }
  return { include: [titles], exclude: [] };
}
