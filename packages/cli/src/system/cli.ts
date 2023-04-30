import { breadc } from 'breadc';
import { AnimeSystem } from '@animespace/core';

import { version, description } from '../../package.json';

export async function makeCliApp(system: AnimeSystem) {
  const app = breadc('anime', { version, description });
  for (const plugin of system.space.plugins) {
    await plugin.command?.(system, app);
  }
  return app;
}
