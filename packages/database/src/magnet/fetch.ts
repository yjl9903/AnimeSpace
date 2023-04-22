import type { Prisma } from '@prisma/client';

import createDebug from 'debug';
import HttpsProxyAgent from 'https-proxy-agent';
import { ofetch } from 'ofetch/node';
import { fetchResources } from 'animegarden';

const debug = createDebug('anime:search');

export async function fetchResource(
  page: number
): Promise<Prisma.ResourceCreateInput[]> {
  const { resources } = await fetchResources(
    (url) =>
      ofetch.native(url, {
        // @ts-ignore
        agent: proxy() ? new HttpsProxyAgent(proxy()) : undefined
      }),
    {
      page
    }
  );

  return resources.map((r) => ({
    type: r.type,
    id: r.href.split('/').at(-1)!,
    title: r.title,
    fansub: r.fansub?.name ?? '',
    magnet: r.magnet,
    createdAt: new Date(r.createdAt)
  }));
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
