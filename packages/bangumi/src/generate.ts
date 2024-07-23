import path from 'path';
import fs from 'fs-extra';

import { AnimeSystem, ufetch, uniqBy } from '@animespace/core';

import { fetchResources } from 'animegarden';
import { bold, lightBlue, lightRed } from '@breadc/color';
import { format, getYear, subMonths } from 'date-fns';
import { BgmClient, type CollectionInformation } from 'bgmc';

type Item<T> = T extends Array<infer R> ? R : never;

type CollectionItem = Item<NonNullable<CollectionInformation['data']>>;

const client = new BgmClient(ufetch, { maxRetry: 1 });

export async function generatePlan(
  system: AnimeSystem,
  collections: CollectionItem[] | number[],
  options: {
    create: string | undefined;
    fansub: boolean;
    date: string | undefined;
  }
) {
  const output: string[] = [];
  const writeln = (text: string) => {
    if (options.create) {
      output.push(text);
    } else {
      console.log(text);
    }
  };

  const now = new Date();
  const date = inferDate(options.date);
  writeln(`title: 创建于 ${format(now, 'yyyy-MM-dd hh:mm')}`);
  writeln(``);
  writeln(`date: ${format(date, 'yyyy-MM-dd hh:mm')}`);
  writeln(``);
  writeln(`status: onair`);
  writeln(``);
  writeln(`onair:`);
  for (const anime of collections) {
    if (typeof anime === 'object') {
      const begin = anime.subject?.date ? new Date(anime.subject.date) : undefined;
      if (begin && begin.getTime() < date.getTime()) {
        continue;
      }

      if (options.create) {
        system.logger.log(
          `${lightBlue('Searching')} ${bold(
            anime.subject?.name_cn || anime.subject?.name || `Bangumi ${anime.subject_id}`
          )}`
        );
      }
    }

    try {
      const item = await client.subject(typeof anime === 'object' ? anime.subject_id : anime);

      const title = item.name_cn || item.name;
      const aliasBox = item.infobox?.find((box) => box.key === '别名');
      const translations = Array.isArray(aliasBox?.value)
        ? ((aliasBox?.value.map((v) => v?.v).filter(Boolean) as string[]) ?? [])
        : typeof aliasBox?.value === 'string'
          ? [aliasBox.value]
          : [];

      if (item.name && item.name !== title) {
        translations.unshift(item.name);
      }

      const plan = {
        title,
        bgm: '' + item.id,
        season: inferSeason(title, ...translations),
        type: inferType(item),
        translations
      };

      const escapeString = (t: string) => t.replace(`'`, `''`);

      writeln(`  - title: ${escapeString(plan.title)}`);
      writeln(`    alias:`);
      for (const t of plan.translations ?? []) {
        writeln(`      - '${escapeString(t)}'`);
      }
      if (plan.season !== 1) {
        writeln(`    season: ${plan.season}`);
      }
      writeln(`    bgm: '${plan.bgm}'`);
      if (plan.type) {
        writeln(`    type: '${plan.type}'`);
      }

      if (options.fansub) {
        const fansub = await getFansub([plan.title, ...plan.translations]);
        writeln(`    fansub:`);
        if (fansub.length === 0) {
          writeln(`      # No fansub found, please check the translations or search keywords`);
        }
        for (const f of fansub) {
          writeln(`      - ${f}`);
        }
        if (fansub.length === 0 && options.create) {
          system.logger.warn(`No fansub found for ${title}`);
        }
      }

      const includeURL = JSON.stringify([[title, ...translations]])
        .replace(/\[/g, '%5B')
        .replace(/\]/g, '%5D')
        .replace(/,/g, '%2C')
        .replace(/"/g, '%22')
        .replace(/ /g, '%20');
      writeln(
        `    # https://garden.breadio.wiki/resources/1?include=${includeURL}&after=${encodeURIComponent(
          date.toISOString()
        )}`
      );
      writeln(``);
    } catch (error) {
      if (typeof anime === 'object') {
        system.logger.error(
          `${lightRed('Failed to search')} ${bold(
            anime.subject?.name_cn || anime.subject?.name || `Bangumi ${anime.subject_id}`
          )}`
        );
      } else {
        system.logger.error(error);
      }
    }
  }

  if (options.create) {
    const p = path.join(system.space.root.resolve(options.create).path);
    await fs.writeFile(p, output.join('\n'), 'utf-8');
  }
}

export async function searchBgm(input: string) {
  return (await client.search(input, { type: 2 })).list ?? [];
}

export async function getCollections(username: string) {
  const list: CollectionItem[] = [];
  while (true) {
    const { data } = await client.getCollections(username, {
      subject_type: 2,
      type: 3,
      limit: 50,
      offset: list.length
    });
    if (data && data.length > 0) {
      list.push(...data);
    } else {
      break;
    }
  }
  return uniqBy(list, (c) => '' + c.subject_id);
}

async function getFansub(titles: string[]) {
  const { resources } = await fetchResources(ufetch, {
    include: titles,
    count: -1,
    retry: 5
  });
  return uniqBy(
    resources.filter((r) => !!r.fansub),
    (r) => r.fansub!.name
  ).map((r) => r.fansub!.name);
}

function inferType(subject: Awaited<ReturnType<BgmClient['subject']>>) {
  const FILM = ['电影', '剧场版'];
  const titles = [subject.name, subject.name_cn];

  {
    for (const title of titles) {
      for (const f of FILM) {
        if (title && title.includes(f)) {
          return '电影';
        }
      }
    }
  }
  {
    for (const tag of subject.tags) {
      if (FILM.includes(tag.name)) {
        return '电影';
      }
    }
  }

  return undefined;
}

function inferSeason(...titles: string[]) {
  for (const title of titles) {
    {
      const match = /Season\s*(\d+)/.exec(title);
      if (match) {
        return +match[1];
      }
    }
    {
      const match = /第\s*(\d+)\s*(季|期)/.exec(title);
      if (match) {
        return +match[1];
      }
    }
    if (title.includes('第二季')) return 2;
    if (title.includes('第三季')) return 3;
    if (title.includes('第四季')) return 4;
    if (title.includes('第五季')) return 5;
    if (title.includes('第六季')) return 6;
    if (title.includes('第七季')) return 7;
    if (title.includes('第八季')) return 8;
    if (title.includes('第九季')) return 9;
    if (title.includes('第十季')) return 10;
  }
  return 1;
}

function inferDate(now: string | undefined) {
  const date = !!now ? new Date(now) : new Date();
  const d1 = new Date(getYear(date), 1, 1, 0, 0, 0);
  const d2 = new Date(getYear(date), 4, 1, 0, 0, 0);
  const d3 = new Date(getYear(date), 7, 1, 0, 0, 0);
  const d4 = new Date(getYear(date), 10, 1, 0, 0, 0);
  const d5 = new Date(getYear(date) + 1, 1, 1, 0, 0, 0);
  if (d1.getTime() > date.getTime()) {
    return subMonths(d1, 1);
  } else if (d2.getTime() > date.getTime()) {
    return subMonths(d2, 1);
  } else if (d3.getTime() > date.getTime()) {
    return subMonths(d3, 1);
  } else if (d4.getTime() > date.getTime()) {
    return subMonths(d4, 1);
  } else {
    return subMonths(d5, 1);
  }
}
