import axios from 'axios';
import { parse } from 'node-html-parser';

import { context } from '../context';

export async function findResources(keywords: string[]) {
  const results: SearchResultItem[] = [];
  for (const title of keywords) {
    results.push(...(await doSearch([title])));
  }
  const foundIds = new Set(
    (await context.magnetLog.list()).map(({ id }) => id)
  );
  await context.magnetLog.append(
    ...results
      .map((r) => ({ id: r.id, magnet: r.magnet }))
      .filter((r) => {
        const flag = !foundIds.has(r.id);
        foundIds.add(r.id);
        return flag;
      })
  );
  return results;
}

async function doSearch(keywords: string[]): Promise<SearchResultItem[]> {
  const searchResult: SearchResultItem[] = [];

  for (let page = 1; ; page++) {
    await sleep();
    try {
      const result = await axios.get(
        `https://share.dmhy.org/topics/list/page/${page}`,
        {
          params: {
            keyword: keywords.join('%7C'),
            sort_id: 2,
            team_id: 0,
            order: 'date-desc'
          },
          proxy: getProxy()
        }
      );

      const content: string = result.data;
      const root = parse(content);
      const oldLength = searchResult.length;
      for (const row of root.querySelectorAll('#topic_list tbody tr')) {
        const tds = row.querySelectorAll('td');
        const type = tds[1].innerText.trim();
        const td2a = tds[2].querySelectorAll('a');

        if (type !== '動畫') continue;
        if (td2a.length < 2) continue;

        const parseId = (text: string) => {
          const split = text.split('/');
          const name = split[split.length - 1];
          if (name.endsWith('.html')) {
            return name.replace(/\.html$/, '');
          } else {
            return name;
          }
        };

        const time = tds[0].querySelector('span')?.innerText.trim();
        const fansub = td2a[0]?.innerText.trim();
        const name = td2a[1]?.innerText.trim();
        const id = parseId(td2a[1]?.getAttribute('href')!);
        const magnet = tds[3].querySelector('a')?.getAttribute('href');

        if (!magnet || !time) continue;

        searchResult.push({
          id,
          name,
          fansub,
          magnet,
          creationTime: new Date(time).toISOString()
        });
      }
      if (oldLength === searchResult.length) break;
    } catch (error) {
      break;
    }
  }
  return searchResult;
}

export interface SearchResult {
  keywords: string[];
  results: SearchResultItem[];
}

export interface SearchResultItem {
  id: string;
  name: string;
  magnet: string;
  fansub: string;
  creationTime: string;
}

export interface MagnetInfo {
  id: string;
  magnet: string;
}

export function formatMagnetURL(magnetId: string) {
  return `https://share.dmhy.org/topics/view/${magnetId}.html`;
}

function getProxy() {
  const proxy = process.env.HTTP_PROXY ?? process.env.HTTPS_PROXY;
  if (proxy) {
    const RE = /(\d+\.\d+\.\d+\.\d+):(\d+)/;
    const match = RE.exec(proxy);
    if (match) {
      return {
        protocol: 'http',
        host: match[1],
        port: +match[2]
      };
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

function sleep(timeout = 1000): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
  });
}
