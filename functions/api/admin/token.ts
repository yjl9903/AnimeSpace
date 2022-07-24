import type { APIFunction } from '../../types';

import { makeErrorResponse, makeResponse } from '../../utils';

export const onRequestPost: APIFunction = async ({ env, request }) => {
  if (env.user.type === 'root') {
    const {
      token = randomString(),
      type = 'user',
      comment = ''
    } = await request.json<{
      token?: string;
      type?: string;
      comment?: string;
    }>();
    const user = {
      token,
      type: ['user', 'admin'].includes(type)
        ? (type as 'user' | 'admin')
        : 'user',
      comment
    };
    await env.UserStore.put(user.token, user);
    return makeResponse(user);
  } else {
    return makeErrorResponse('Unauthorized', { status: 401 });
  }
};

export const onRequestGet: APIFunction = async ({ env }) => {
  if (env.user.type === 'root') {
    const tokens = (await env.UserStore.list())
      .map((token) => ({
        token: token.token,
        type: token.type,
        comment: token.comment,
        access: token.access ?? []
      }))
      .sort((lhs, rhs) => {
        const id = (t: string) => {
          if (t === 'root') return 0;
          if (t === 'admin') return 1;
          if (t === 'user') return 2;
          return 3;
        };
        return id(lhs.type) - id(rhs.type);
      });
    return makeResponse({ tokens });
  } else {
    return makeErrorResponse('Unauthorized', { status: 401 });
  }
};

export const onRequestDelete: APIFunction = async ({ env, request }) => {
  if (env.user.type === 'root') {
    const { command = 'delete', token } = await request.json<{
      command?: 'delete' | 'visitor';
      token?: string;
    }>();
    if (command === 'delete') {
      if (token) {
        await env.UserStore.remove(token);
        return makeResponse({ token });
      }
    } else if (command === 'visitor') {
      const tokens = await env.UserStore.list();
      const visitors = tokens.filter((t) => t.type === 'visitor');
      for (const token of visitors) {
        await Promise.all([
          env.UserSyncStore.remove(token.token),
          env.UserStore.remove(token.token)
        ]);
      }
      return makeResponse({
        tokens: visitors.map((t) => t.token)
      });
    }
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
