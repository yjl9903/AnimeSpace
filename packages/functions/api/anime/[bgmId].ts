import { makePagesFunction, makeResponse } from '../../utils';

export const onRequestGet = makePagesFunction(async ({}) => {
  return makeResponse({});
});
