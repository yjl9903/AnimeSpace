import type { APIFunction } from '../types';

import { makeResponse } from '../utils';
import { ONAIR_KEY } from '../utils/constant';

// Cache one hour
const CacheDuration = 60 * 60;

export const onRequestGet: APIFunction = async ({ env }) => {
  const onairCache = (await env.AnimeStore.get(ONAIR_KEY)) ?? {};
  const onair = Object.values(onairCache)
    .flat()
    .map((anime) => {
      // @ts-ignore
      delete anime['uploadBy'];
      anime.episodes.forEach((ep) => {
        // @ts-ignore
        delete ep['storage'];
      });
      return anime;
    });
  return makeResponse(
    { onair },
    { headers: { 'Cache-Control': `max-age=${CacheDuration}` } }
  );
};
