import fs from 'node:fs';
import { parse } from 'yaml';
import { globby } from 'globby';

import { formatStringArray } from '../utils';

import type { KeywordsParams, Plan } from './types';

export async function loadPlan(patterns: string[]) {
  const files = await globby(patterns);
  const plans = await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf-8');
      const plan = parse(content);

      const state =
        plan.state === 'onair' || plan.state === 'finish'
          ? plan.state
          : 'onair';
      const date = new Date(plan.date);

      return <Plan>{
        ...plan,
        name: plan.name ?? 'unknown',
        date,
        state,
        onair: formatStringArray(plan.onair).map((o: any) => {
          const title = String(o.title);
          const oState =
            o.state === 'onair' || o.state === 'finish' ? o.state : state;
          const type = ['番剧', '电影', 'OVA'].includes(o.type)
            ? o.type
            : '番剧';

          return {
            ...o,
            title,
            bgmId: String(o.bgmId),
            type,
            state: oState,
            season: o.season ? +o.season : 1,
            date: o.date ? new Date(o.date) : date,
            keywords: formatKeywordsArray(title, o.keywords)
          };
        })
      };
    })
  );
  return plans;
}

function formatKeywordsArray(title: string, keywords: any): KeywordsParams {
  if (keywords !== undefined && keywords !== null) {
    if (typeof keywords === 'string') {
      if (!keywords.startsWith('!')) {
        return { include: [[title, keywords]], exclude: [] };
      } else {
        return { include: [[title]], exclude: [keywords.slice(1)] };
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
  return { include: [[title]], exclude: [] };
}
