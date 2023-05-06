import { type Plugin, type PluginEntry } from '@animespace/core';

export interface BangumiOptions extends PluginEntry {
  username?: string;
}

export function Bangumi(options: BangumiOptions): Plugin {
  return {
    name: 'bangumi',
    options,
    command(system, cli) {}
  };
}
