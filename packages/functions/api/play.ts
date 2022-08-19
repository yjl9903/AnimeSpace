import { ONAIR_KEY } from '../utils/constant';
import { makePagesFunction, makeResponse } from '../utils';

// Cache one hour
const CacheDuration = 60 * 60;

export const onRequestGet = makePagesFunction(async ({ env }) => {
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

  const timestamp = new Date(
    onair.reduce((p, o) => Math.max(new Date(o.timestamp).getTime(), p), 0)
  ).toISOString();

  return makeResponse(
    { onair, timestamp },
    { headers: { 'Cache-Control': `public, max-age=${CacheDuration}` } }
  );
});
