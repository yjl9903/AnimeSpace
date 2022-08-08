import type { Plugin } from 'vite';

import { load } from './load';

export function createBangumiPlugin(): Plugin {
  return {
    name: 'animepaste:bangumi',
    resolveId(id) {
      if (id.startsWith('~bangumi/')) {
        id = '\0' + id;
        if (!id.endsWith('.json')) {
          id += '.json';
        }
        return id;
      }
    },
    load(id) {
      const PREFIX = '\0~bangumi/';
      if (id.startsWith(PREFIX)) {
        id = id.slice(PREFIX.length);
        const data = load(id);
        return JSON.stringify(data);
      }
    }
  };
}
