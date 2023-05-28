import openEditor from 'open-editor';
import { type Breadc, breadc } from 'breadc';
import { AnimeSystem, onDeath } from '@animespace/core';
import { lightBlue, lightGreen, lightRed } from '@breadc/color';

import { description, version } from '../../package.json';

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
    .action(async options => {
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
    .action(async options => {
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
          await writeBack(sys);

          sys = await makeSystem();
          sys.logger.log('');
          cancell();
        }
      };
      await loop(refresh, options.duration);
    });

  app
    .command('refresh', 'Refresh the local anime system')
    .option('--filter <keyword>', 'Filter animes to be refreshed')
    .option('-i, --introspect', 'Introspect library before refreshing')
    .action(async options => {
      registerDeath(system);

      system.printSpace();
      try {
        if (options.introspect) {
          await system.introspect({ filter: options.filter });
        }
        const animes = await system.refresh({ filter: options.filter });
        return animes;
      } catch (error) {
        throw error;
      } finally {
        await writeBack(system);
      }
    });

  app
    .command('introspect', 'Introspect the local anime system')
    .option('--filter <keyword>', 'Filter animes to be refreshed')
    .action(async options => {
      registerDeath(system);

      system.printSpace();
      try {
        const animes = await system.introspect({ filter: options.filter });
        return animes;
      } catch (error) {
        throw error;
      } finally {
        await writeBack(system);
      }
    });

  function registerDeath(system: AnimeSystem) {
    return onDeath(async (signal, context) => {
      system.logger.info(lightRed('Process is being killed'));
      await writeBack(system);
      context.terminate = 'exit';
    });
  }

  async function writeBack(system: AnimeSystem) {
    if (system.isChanged()) {
      system.logger.info(lightBlue('Writing back anime libraries'));
      await system.writeBack();
      system.logger.info(lightGreen('Anime libraries have been written back'));
    }
  }
}
