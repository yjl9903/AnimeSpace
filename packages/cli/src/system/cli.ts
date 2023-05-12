import openEditor from 'open-editor';
import { lightGreen, lightRed } from '@breadc/color';
import { type Breadc, breadc } from 'breadc';
import { AnimeSystem, onDeath } from '@animespace/core';

import { version, description } from '../../package.json';

import { loop } from './utils';
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
      // Refresh system
      let sys = system;
      const refresh = async () => {
        const cancell = registerDeath(sys);
        try {
          sys.printSpace();
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
          cancell();
        }
      };
      await loop(refresh, options.duration);
    });

  app
    .command('refresh', 'Refresh the local anime system')
    .option('-i, --introspect', 'Introspect library before refreshing')
    .action(async (options) => {
      registerDeath(system);

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
      registerDeath(system);

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

  function registerDeath(system: AnimeSystem) {
    return onDeath(async (signal, context) => {
      system.logger.info(lightRed('Process is being killed'));
      if (system.isChanged()) {
        await system.writeBack();
        system.logger.info(
          lightGreen('Anime libraries have been written back')
        );
      }
      context.terminate = 'exit';
    });
  }
}
