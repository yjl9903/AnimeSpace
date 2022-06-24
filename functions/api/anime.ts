import type { APIFunction, OnairAnime } from '../types';

import { makeResponse } from '../utils';
import { ONAIR_KEY } from '../utils/constant';

export const onRequestGet: APIFunction = async ({ env }) => {
  const onair = (await env.AnimeStore.get(ONAIR_KEY)) ?? {};
  Object.values(onair)
    .flat()
    .map((anime) => {
      const newAnime: Omit<OnairAnime, 'uploadBy'> = anime;
      delete newAnime['uploadBy'];
      return newAnime;
    });
  return makeResponse({ onair });
};
