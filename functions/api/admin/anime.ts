import type { APIFunction, OnairAnime } from '../../types';

import { ONAIR_KEY } from '../../utils/constant';
import { makeErrorResponse, makeResponse } from '../../utils';

interface Payload {
  onair: OnairAnime[];
}

export const onRequestGet: APIFunction = async ({ env }) => {
  if (env.user.type === 'root' || env.user.type === 'admin') {
    const oldOnair = (await env.AnimeStore.get(ONAIR_KEY)) ?? {};
    const onair = oldOnair[env.user.token] ?? [];
    return makeResponse({ onair });
  } else {
    return makeErrorResponse('Unauthorized', { status: 401 });
  }
};

export const onRequestPost: APIFunction = async ({ env, request }) => {
  if (env.user.type === 'root' || env.user.type === 'admin') {
    const { onair } = await request.json<Payload>();

    // Setup uploadBy token
    const setOnair = onair.map((o) => {
      return {
        title: o.title,
        bgmId: o.bgmId,
        link: o.link,
        uploadBy: env.user.token,
        episodes: o.episodes.map((ep) => ({
          ep: ep.ep,
          quality: ep.quality,
          creationTime: ep.creationTime,
          playURL: ep.playURL,
          storage: {
            type: ep.storage?.type ?? '',
            videoId: ep.storage?.videoId ?? '',
            source: ep.storage?.source ?? {}
          }
        }))
      };
    });

    const newOnair = (await env.AnimeStore.get(ONAIR_KEY)) ?? {};
    newOnair[env.user.token] = setOnair;
    await env.AnimeStore.put(ONAIR_KEY, newOnair);

    return makeResponse({ onair });
  } else {
    return makeErrorResponse('Unauthorized', { status: 401 });
  }
};
