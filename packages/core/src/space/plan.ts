import fs from 'fs-extra';
import fg from 'fast-glob';
import path from 'node:path';
import { parse } from 'yaml';
import { z, AnyZodObject } from 'zod';

import type { Plugin } from '../plugin';

import { AnimeSystemError } from '../error';

import {
  AnimePlan,
  AnimePlanSchema,
  KeywordsParams,
  Plan,
  PlanSchema
} from './schema';

export async function loadPlan(
  cwd: string,
  patterns: string[],
  plugins: Plugin[]
): Promise<Plan[]> {
  const animePlanSchema = plugins.reduce(
    (acc: AnyZodObject, plugin) =>
      plugin?.schema?.plan ? acc.merge(plugin?.schema?.plan) : acc,
    AnimePlanSchema
  ) as typeof AnimePlanSchema;
  const Schema = PlanSchema.extend({
    onair: z.array(animePlanSchema).default([])
  });

  const files = await fg(patterns, { cwd, dot: true });

  const plans = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.resolve(cwd, file), 'utf-8');
      const parsed = Schema.safeParse(parse(content));
      if (parsed.success) {
        const plan: Plan = {
          ...parsed.data,
          onair: parsed.data.onair.map(
            (o: z.infer<typeof AnimePlanSchema>) =>
              ({
                ...o,
                // Inherit plan status
                status: o.status ? o.status : parsed.data.status,
                // Inherit plan date
                date: o.date ? o.date : parsed.data.date,
                // Manually resolve keywords
                keywords: resolveKeywordsArray(
                  o.title,
                  o.translations,
                  o.keywords
                )
              } as AnimePlan)
          )
        };
        return plan;
      } else {
        console.log(parsed.error.issues);
        console.error(`Failed parsing plan ${path.basename(file)}`);
        throw new AnimeSystemError('Failed to parse plan');
      }
    })
  );
  return plans;
}

function resolveKeywordsArray(
  title: string,
  translations: Record<string, string[]>,
  keywords: any
): KeywordsParams {
  const titles = [
    title,
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
      const include: string[][] = [];
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
