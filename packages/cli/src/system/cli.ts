import openEditor from 'open-editor';
import { type Breadc, breadc } from 'breadc';
import { AnimeSystem, onDeath } from '@animespace/core';

import { version, description } from '../../package.json';

import { makeSystem } from './system';

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
    .option('--storage', 'Display the storage directory')
    .option('--open', 'Open space in your editor')
    .action(async (options) => {
      const root = options.storage ? system.space.storage : system.space.root;
      if (options.open) {
        try {
          openEditor([root]);
        } catch (error) {
          console.log(root);
        }
      } else {
        console.log(root);
      }
      return root;
    });

  app
    .command('watch', 'Watch anime system update')
    .option('-d, --duration <time>', 'Refresh time interval', {
      default: '10m'
    })
    .option('-i, --introspect', 'Introspect library before refreshing')
    .action(async (options) => {
      registerDeath();

      // Refresh system
      let sys = system;
      sys.printSpace();
      const duration = parseDuration(options.duration);
      const refresh = async () => {
        try {
          if (options.introspect) {
            await sys.introspect();
          }
          await sys.refresh();
        } catch (error) {
          sys.logger.error(error);
        } finally {
          await sys.writeBack();
          sys = await makeSystem();
          sys.logger.log('');
          setTimeout(refresh, duration);
        }
      };

      await refresh();
    });

  app
    .command('refresh', 'Refresh the local anime system')
    .option('-i, --introspect', 'Introspect library before refreshing')
    .action(async (options) => {
      registerDeath();

      system.printSpace();
      try {
        if (options.introspect) {
          await system.introspect();
        }
        const animes = await system.refresh();
        return animes;
      } catch (error) {
        throw error;
      } finally {
        await system.writeBack();
      }
    });

  app
    .command('introspect', 'Introspect the local anime system')
    .action(async () => {
      registerDeath();

      system.printSpace();
      try {
        const animes = await system.introspect();
        return animes;
      } catch (error) {
        throw error;
      } finally {
        await system.writeBack();
      }
    });

  function registerDeath() {
    onDeath(async () => {
      await system.writeBack();
    });
  }
}

function parseDuration(text: string) {
  const s = /^(\d+)s$/.exec(text);
  if (s) {
    return +s[1] * 1000;
  }
  const m = /^(\d+)m$/.exec(text);
  if (m) {
    return +m[1] * 60 * 1000;
  }
  const h = /^(\d+)h$/.exec(text);
  if (h) {
    return +h[1] * 60 * 60 * 1000;
  }
  return 10 * 60 * 1000;
}
