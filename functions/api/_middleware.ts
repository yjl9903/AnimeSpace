import { Visitor } from './../types.d';
import type { Admin, APIFunction, User } from '../types';

import { makeErrorResponse } from '../utils';
import { KVStore } from '../utils/store';

export const onRequest: APIFunction = async (ctx) => {
  const request = ctx.request;
  const auth = request.headers.get('Authorization');

  // Setup KVStores
  ctx.env.UserStore = new KVStore(ctx.env.ANIME, 'user');
  ctx.env.AnimeStore = new KVStore(ctx.env.ANIME, 'anime');

  if (auth) {
    const user = await ctx.env.UserStore.get(auth);
    if (user) {
      const ok = await canAccess(user, ctx.request);
      await ctx.env.UserStore.put(user.token, user);
      if (ok) {
        ctx.env.user = user;
        return await ctx.next();
      } else {
        return makeUnauthResponse();
      }
    } else {
      // User not found, but in dev create a root user
      if (ctx.env.DEV === 'true') {
        const root = {
          token: auth,
          type: 'root' as 'root',
          comment: 'Created by DEV env'
        };
        await ctx.env.UserStore.put(root.token, root);
        ctx.env.user = root;
        return await ctx.next();
      } else if (ctx.env.ENABLE_PUBLIC === 'true') {
        const visitor = {
          token: auth,
          type: 'visitor' as 'visitor',
          comment: 'Visitor'
        };
        await canAccess(visitor, ctx.request);
        await ctx.env.UserStore.put(visitor.token, visitor);
        ctx.env.user = visitor;
        return await ctx.next();
      }

      return makeUnauthResponse();
    }
  } else {
    return makeUnauthResponse();
  }
};

/**
 * 3 connections
 */
const MAX_ACCESS = 3;

/**
 * 3 hours
 */
const MIN_SWITCH_DURATION = 1000 * 60 * 3;

async function canAccess(user: User | Admin | Visitor, req: Request) {
  if (user.type === 'admin' || user.type === 'root') {
    return true;
  } else {
    const ip = req.headers.get('CF-Connecting-IP');
    if (!ip) return false;
    if (!user.access) user.access = [];
    const existLog = user.access.find((l) => l.ip === ip);
    if (existLog) {
      existLog.count++;
      existLog.timestamp = new Date().getTime();
      return true;
    } else {
      const access = {
        ip,
        count: 1,
        timestamp: new Date().getTime()
      };

      if (user.access.length < MAX_ACCESS) {
        user.access.push(access);
        return true;
      } else {
        let id = 0;
        let lastestAccess = user.access[0];
        for (let i = 0; i < user.access.length; i++) {
          if (user.access[i].timestamp > lastestAccess.timestamp) {
            id = i;
            lastestAccess = user.access[i];
          }
        }
        if (access.timestamp - lastestAccess.timestamp > MIN_SWITCH_DURATION) {
          user.access.splice(id, 1);
          user.access.push(access);
          return true;
        } else {
          return false;
        }
      }
    }
  }
}

function makeUnauthResponse() {
  return makeErrorResponse('Unauthorized', { status: 401 });
}
