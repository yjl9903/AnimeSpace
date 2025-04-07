import { fetch } from 'undici';

export function sleep(timeout: number = 0) {
  return new Promise<void>((res) => {
    setTimeout(() => res(), timeout);
  });
}

export const ufetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
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

export const proxy = {
  enable: false,
  url: undefined as string | undefined
};

export function getProxy() {
  if (!proxy.enable) {
    return undefined;
  }
  if (proxy.url) {
    return proxy.url;
  }

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
