import type { Plugin } from 'vite';

import createDebug from 'debug';

import type { RawExportData } from './types';
import type { TransformOption } from './transform';

import { load } from './load';
import { transform } from './transform';
import { decompress } from './utils';

const debug = createDebug('animepaste:bangumi');

export interface PluginOption extends TransformOption {
  id: string;
}

export function createBangumiPlugin(...options: PluginOption[]): Plugin {
  for (const option of options) {
    if (!option.id.endsWith('.json')) {
      option.id += '.json';
    }
  }

  const map: Map<string, RawExportData | undefined> = new Map(
    options.map((op) => [op.id, undefined])
  );
  const task = Promise.all(
    options.map((option) => {
      try {
        return transform(option).then((data) => {
          map.set(option.id, decompress(data));
        });
      } catch (error) {
        debug(error);
      }
    })
  );

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
    async load(id) {
      const PREFIX = '\0~bangumi/';
      if (id.startsWith(PREFIX)) {
        id = id.slice(PREFIX.length);
        if (map.has(id)) {
          if (!!map.get(id)) {
            return JSON.stringify(map.get(id));
          } else {
            await task;
            if (!!map.get(id)) {
              return JSON.stringify(map.get(id));
            }
          }
        }
        try {
          const data = load(id);
          return JSON.stringify(data);
        } catch (error) {
          this.error((error as any)?.message);
          debug(error);
        }
      }
    }
  };
}
