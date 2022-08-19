import {
  makeRawPagesFunction,
  makeResponse as _makeResponse
} from 'vite-plugin-cloudflare-functions/worker';

export const makePagesFunction = makeRawPagesFunction;

export function makeResponse<T extends object>(
  body: T,
  init: ResponseInit = {}
) {
  return _makeResponse({ status: 'Ok', data: body }, init);
}

export function makeErrorResponse(message: string, init: ResponseInit = {}) {
  return _makeResponse({ status: 'Error', message }, init);
}

export function now() {
  return new Date();
}
