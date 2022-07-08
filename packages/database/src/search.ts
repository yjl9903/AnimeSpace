import got from 'got';
import createDebug from 'debug';
import { parse } from 'node-html-parser';
import { Prisma } from '@prisma/client';
import { HttpsProxyAgent } from 'hpagent';

const debug = createDebug('anime:search');
const proxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const agent = {
  https: proxy ? new HttpsProxyAgent({ proxy }) : undefined
};

export async function fetchResource(
  page: number
): Promise<Prisma.ResourceCreateInput[]> {
  const searchResult: Prisma.ResourceCreateInput[] = [];

  const content = await got
    .get(`https://share.dmhy.org/topics/list/page/${page}`, {
      agent,
      retry: {
        limit: 5
      }
    })
    .text();

  const root = parse(content);

  for (const row of root.querySelectorAll('#topic_list tbody tr')) {
    const tds = row.querySelectorAll('td');
    const type = tds[1].innerText.trim();
    const td2a = tds[2].querySelectorAll('a');

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
    const fansub = td2a[0]?.innerText.trim() ?? '';
    const title = td2a[1]?.innerText.trim();
    const link = parseId(td2a[1]?.getAttribute('href')!);
    const magnet = tds[3].querySelector('a')?.getAttribute('href');

    if (!magnet || !time || !title) {
      debug('Parse HTML Error');
      debug(row.innerHTML);
      continue;
    }

    searchResult.push({
      type,
      link,
      title,
      fansub,
      magnet,
      createdAt: new Date(time)
    });
  }

  return searchResult;
}
