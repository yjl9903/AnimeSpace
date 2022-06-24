import type { APIFunction } from '../../types';
import { makeErrorResponse, makeResponse } from '../../utils';

export const onRequestPost: APIFunction = async ({ env, request }) => {
  if (env.user.type === 'root') {
    const { token = randomString(), type = 'user' } = await request.json<{
      token?: string;
      type?: string;
    }>();
    const user = {
      token,
      type: ['user', 'admin'].includes(type)
        ? (type as 'user' | 'admin')
        : 'user'
    };
    await env.UserStore.put(user.token, user);
    return makeResponse(user);
  } else {
    return makeErrorResponse('Unauthorized', { status: 401 });
  }
};

export const onRequestDelete: APIFunction = async ({ env, request }) => {
  if (env.user.type === 'root') {
    const { token } = await request.json<{ token: string }>();
    await env.UserStore.remove(token);
    return makeResponse({});
  } else {
    return makeErrorResponse('Unauthorized', { status: 401 });
  }
};

function rand(l: number, r: number): number {
  return l + Math.round(Math.random() * (r - l));
}

const character_table = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomString(length = 32): string {
  return Array.apply(null, Array(length))
    .map(() => character_table[rand(0, character_table.length - 1)])
    .join('');
}
