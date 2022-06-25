import type { APIFunction } from '../../types';

import { makeResponse } from '../../utils';

export const onRequestGet: APIFunction = async ({}) => {
  return makeResponse({});
};
