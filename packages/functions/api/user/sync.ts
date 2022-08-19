import { makePagesFunction, makeResponse } from '../../utils';

export const onRequestGet = makePagesFunction(async ({ env }) => {
  const content = (await env.UserSyncStore.get(env.user.token)) ?? 'null';
  return makeResponse({ content });
});

export const onRequestPost = makePagesFunction(async ({ env, request }) => {
  const content = await request.text();
  await env.UserSyncStore.put(env.user.token, content);
  return makeResponse({ content });
});
