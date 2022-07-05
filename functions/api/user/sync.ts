import type { APIFunction } from '../../types';

import { makeResponse } from '../../utils';

export const onRequestGet: APIFunction = async ({ env }) => {
  const content = (await env.UserSyncStore.get(env.user.token)) ?? 'null';
  return makeResponse({ content });
};

export const onRequestPost: APIFunction = async ({ env, request }) => {
  const content = await request.text();
  await env.UserSyncStore.put(env.user.token, content);
  return makeResponse({ content });
};
