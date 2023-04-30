import {
  type Plugin,
  type PluginEntry,
  formatStringArray
} from '@animepaste/core';

export interface AnimeGardenOptions extends PluginEntry {}

export function AnimeGarden(_options: AnimeGardenOptions): Plugin {
  return {
    name: 'animegarden',
    async preparePlans(_space, plans) {
      for (const plan of plans) {
        for (const onair of plan.onair) {
          onair.fansub = formatStringArray(onair.fansub);
        }
      }
    }
  };
}
