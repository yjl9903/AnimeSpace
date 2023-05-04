import { type Plugin, type PluginEntry } from '@animespace/core';

export interface BangumiOptions extends PluginEntry {}

export function Bangumi(options: BangumiOptions): Plugin {
  return {
    name: 'bangumi',
    command(system, cli) {}
  };
}
