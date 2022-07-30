import type { CreateStore } from './base';

import { createAliStore } from './ali';

export * from './base';

export * from './ali';

export function useStore(type: 'ali'): CreateStore {
  if (type === 'ali') {
    return createAliStore;
  } else {
    throw new Error(`Can not find store "${type}"`);
  }
}
