import fs from 'node:fs';
import { parse } from 'yaml';
import { globby } from 'globby';

import { formatStringArray } from '../utils';

import type { Plan } from './types';

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

      return <Plan>{
        ...plan,
        name: plan.name ?? 'unknown',
        date: new Date(plan.date),
        state,
        onair: formatStringArray(plan.onair).map((o: any) => {
          return {
            ...o,
            title: String(o.title),
            bgmId: String(o.bgmId),
            season: o.season ? +o.season : 1
          };
        })
      };
    })
  );
  return plans;
}
