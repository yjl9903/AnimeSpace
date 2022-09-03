import axios from 'axios';
import createDebug from 'debug';
import { parse } from 'node-html-parser';
import { Prisma } from '@prisma/client';

const debug = createDebug('anime:search');

export async function fetchResource(
  page: number
): Promise<Prisma.ResourceCreateInput[]> {
  const searchResult: Prisma.ResourceCreateInput[] = [];

  const result = await axios.get(
    `https://share.dmhy.org/topics/list/page/${page}`,
    {
      proxy: proxy(),
      timeout: 30 * 1000
    }
  );

  const content: string = result.data;
  const root = parse(content);

  for (const row of root.querySelectorAll('#topic_list tbody tr')) {
    const tds = row.querySelectorAll('td');
    const type = tds[1].innerText.trim();
    const td2a = tds[2].querySelectorAll('a');

    if (td2a.length > 2 || td2a.length < 1) {
      debug('Parse HTML Error');
      debug(row.innerHTML);
      continue;
    }

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
    const fansub = td2a.length === 2 ? td2a[0]?.innerText.trim() : '';
    const titleEl = td2a.length === 2 ? td2a[1] : td2a[0];
    const title = titleEl?.innerText.trim();
    const id = parseId(titleEl?.getAttribute('href')!);
    const magnet = tds[3].querySelector('a')?.getAttribute('href');

    if (!magnet || !time || !title) {
      debug('Parse HTML Error');
      debug(row.innerHTML);
      continue;
    }

    searchResult.push({
      type,
      id,
      title,
      fansub,
      magnet,
      createdAt: new Date(time)
    });
  }

  return searchResult;
}

export function proxy() {
  const proxy =
    process.env.https_proxy ??
    process.env.HTTPS_PROXY ??
    process.env.http_proxy ??
    process.env.HTTP_PROXY;
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
