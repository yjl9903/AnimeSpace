import type { CreateStore } from './types';

import { createAliStore } from './ali';

export * from './types';

export * from './ali';

export function useStore(type: 'ali'): CreateStore {
  if (type === 'ali') {
    return createAliStore;
  } else {
    throw new Error(`Can not find store "${type}"`);
  }
}
