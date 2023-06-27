import { fetch } from 'undici';
import { Anime } from '@animespace/core';
import { fetchResources } from 'animegarden';

export async function fetchAnimeResources(anime: Anime) {
  const { resources } = await fetchResources(ufetch, {
    type: '動畫',
    after: anime.plan.date,
    include: anime.plan.keywords.include,
    exclude: anime.plan.keywords.exclude,
    retry: 10,
    count: -1,
    progress(res, { url, page }) {}
  });
  return resources;
}

export const ufetch = async (
  url: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  const proxy = getProxy();
  if (!!proxy) {
    const { ProxyAgent } = await import('undici');
    // @ts-ignore
    return fetch(url, {
      ...init,
      dispatcher: new ProxyAgent(proxy)
    });
  } else {
    // @ts-ignore
    return fetch(url, init);
  }
};

export function getProxy() {
  const env = process?.env ?? {};
  const list = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'];
  for (const l of list) {
    const t = env[l];
    if (!!t) {
      return t;
    }
  }
  return undefined;
}
