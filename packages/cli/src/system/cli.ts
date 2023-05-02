import { type Breadc, breadc } from 'breadc';
import { AnimeSystem } from '@animespace/core';

import { version, description } from '../../package.json';

import { inferRoot } from './system';

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
    .command('space', 'Display the space directory')
    .option('--open', 'Open space in your editor')
    .action(async (options) => {
      const root = inferRoot();
      if (options.open) {
        const openEditor = (await import('open-editor')).default;
        openEditor([root]);
      } else {
        console.log(root);
      }
      return root;
    });

  app
    .command('refresh', 'Refresh the local anime system')
    .option('-i, --introspect')
    .action(async (options) => {
      if (options.introspect) {
        await system.introspect();
      }
      const animes = await system.refresh();
      await system.writeBack();
      return animes;
    });

  app
    .command('introspect', 'Introspect the local anime system')
    .action(async () => {
      const animes = await system.introspect();
      await system.writeBack();
      return animes;
    });
}
