import { type Breadc, breadc } from 'breadc';
import { AnimeSystem } from '@animespace/core';

import { version, description } from '../../package.json';

export async function makeCliApp(system: AnimeSystem) {
  const app = breadc('anime', { version, description });
  registerApp(system, app);
  for (const plugin of system.space.plugins) {
    await plugin.command?.(system, app);
  }
  return app;
}

function registerApp(system: AnimeSystem, app: Breadc<{}>) {
  app
    .command('refresh', 'Refresh the local anime system')
    .option('--introspect')
    .action(async (options) => {
      if (options.introspect) {
        await system.introspect();
      }
      return await system.refresh();
    });

  app
    .command('introspect', 'Introspect the local anime system')
    .action(async () => {
      return await system.introspect();
    });
}
