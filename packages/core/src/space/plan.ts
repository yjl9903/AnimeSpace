import fs from 'fs-extra';
import fg from 'fast-glob';
import path from 'node:path';
import { parse } from 'yaml';

import { formatStringArray } from '../utils';

import type { KeywordsParams, Plan } from './types';

export async function loadPlan(cwd: string, patterns: string[]) {
  const files = await fg(patterns, { cwd, dot: true });
  const plans = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.resolve(cwd, file), 'utf-8');
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
          const translations = formatTranslations(o.translations);

          return {
            ...o,
            title,
            translations,
            bgmId: String(o.bgmId),
            type,
            state: oState,
            season: o.season ? +o.season : 1,
            date: o.date ? new Date(o.date) : date,
            keywords: formatKeywordsArray(title, translations, o.keywords)
          };
        })
      };
    })
  );
  return plans;
}

function formatTranslations(trans: unknown) {
  if (trans !== undefined && trans !== null) {
    if (typeof trans === 'string') {
      return {
        unknown: [trans]
      };
    } else if (Array.isArray(trans)) {
      return {
        unknown: trans
      };
    } else if (typeof trans === 'object') {
      const entries = Object.entries(trans as any);
      return Object.fromEntries(
        entries.map(([key, value]) => {
          const arr = formatStringArray(value as any);
          return [key, arr];
        })
      );
    }
  }
  return {};
}

function formatKeywordsArray(
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
