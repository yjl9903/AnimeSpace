import fs from 'fs-extra';
import path from 'pathe';
import { execSync } from 'node:child_process';

import openEditor from 'open-editor';
import { type Breadc, breadc } from 'breadc';
import { dim, lightBlue, lightCyan, lightGreen, lightRed } from '@breadc/color';
import { AnimeSystem, LocalVideoDelta, onDeath, printDelta } from '@animespace/core';

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
  const isTTY = !!process?.stdout?.isTTY;

  app
    .command('space', 'Display the space directory')
    .option('--open', 'Open space in your editor')
    .action(async (options) => {
      const root = system.space.root;
      const cmds = options['--'];
      if (cmds.length > 0) {
        if (isTTY) {
          system.printSpace();
        }
        execSync(cmds.join(' '), { cwd: root.path, stdio: 'inherit' });
      } else if (options.open) {
        try {
          openEditor([root.path]);
        } catch (error) {
          console.log(root);
        }
      } else {
        console.log(root);
      }
      return root;
    });

  app
    .command('run <command> [...args]', 'Run command in the space directory')
    .action(async (command, args) => {
      const pkgJson = await fs
        .readJSON(system.space.root.resolve('package.json').path)
        .catch(() => undefined);

      const env = { ...process.env };
      env.PATH = [
        ...(process.env.PATH ?? '').split(path.delimiter),
        system.space.root.resolve('node_modules/.bin').path
      ].join(path.delimiter);

      if (pkgJson.scripts && command in pkgJson.scripts) {
        const cmd = pkgJson.scripts[command] as string;

        if (isTTY) {
          system.printSpace();
        }

        execSync(cmd + ' ' + args.join(' '), {
          cwd: system.space.root.path,
          stdio: 'inherit',
          env
        });
      } else {
        if (isTTY) {
          system.printSpace();
        }

        execSync(command + ' ' + args.join(' '), {
          cwd: system.space.root.path,
          stdio: 'inherit',
          env
        });
      }
    });

  app
    .command('watch', 'Watch anime system update')
    .option('-d, --duration <time>', 'Refresh time interval', {
      default: '10m'
    })
    .option('-i, --introspect', 'Introspect library before refreshing')
    .option('-f, --force', 'Prefer not using any cache')
    .action(async (options) => {
      // Refresh system
      let sys = system;

      if (options.introspect) {
        await sys.introspect();
      }

      const delta: LocalVideoDelta[] = [];

      const refresh = async () => {
        const cancel = registerDeath(sys);
        try {
          sys.printSpace();

          const animes = await sys.refresh({
            force: options.force,
            logDelta: false
          });
          delta.push(...animes.flatMap((a) => a.delta));

          if (delta.length > 0) {
            sys.logger.log('');
            sys.logger.log(
              `${dim('There are')} ${lightCyan(delta.length + ' changes')} ${dim(
                'applied to the space'
              )}`
            );
            printDelta(sys.logger, delta);
          }
        } catch (error) {
          sys.logger.error(error);
        } finally {
          await writeBack(sys);

          sys = await makeSystem();
          sys.logger.log('');
          cancel();
        }
      };
      await loop(refresh, options.duration);
    });

  app
    .command('refresh', 'Refresh the local anime system')
    .option('--filter <keyword>', 'Filter animes to be refreshed')
    .option('--status <status>', {
      description: 'Filter onair / finish animes',
      default: 'onair',
      cast: (v) => (v === 'finish' ? 'finish' : 'onair')
    })
    .option('-i, --introspect', 'Introspect library before refreshing')
    .option('-f, --force', 'Prefer not using any cache')
    .action(async (options) => {
      registerDeath(system);

      system.printSpace();
      try {
        const filter = options.filter
          ? ({ keyword: options.filter, status: options.status } as const)
          : options.status === 'finish'
            ? ({ keyword: '', status: options.status } as const)
            : undefined;

        if (options.introspect) {
          await system.introspect({
            filter
          });
        }
        const animes = await system.refresh({
          filter,
          force: options.force
        });
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
    .action(async (options) => {
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
      system.logger.log(lightRed('Process is being killed'));
      await writeBack(system);
      context.terminate = 'exit';
    });
  }

  async function writeBack(system: AnimeSystem) {
    if (system.isChanged()) {
      system.logger.log(lightBlue('Writing back anime libraries'));
      system.printDelta();
      await system.writeBack();
      system.logger.log(lightGreen('Anime libraries have been written back'));
    }
  }
}
