import type { AnimeType } from '../types';

import { context } from '../context';
import { IndexListener } from '../logger';

import { app } from './app';

app
  .command('watch', 'Watch anime resources update')
  .option('-i, --interval [duration]', 'Damon interval in minutes', {
    construct(t) {
      return t ? +t : 10;
    }
  })
  .option('-o, --once', 'Just do an immediate update')
  .option('--update', 'Only update info')
  .action(async (option) => {
    const { startDaemon } = await import('../daemon');
    await startDaemon(option);
  });

app
  .command('plan', 'Preview onair plan')
  .option('--type [type]', 'One of local or server')
  .action(async (option) => {
    const { Plan } = await import('../daemon');
    const plan = await Plan.create();
    const type = option.type ?? 'local';
    if (type === 'local') {
      plan.printOnair();
    } else if (type === 'server') {
      plan.printOnair();
    }
  });

app
  .command('search [anime]', 'Search Bangumi resources')
  .option('--type [type]', {
    construct(t) {
      if (t && ['tv', 'web', 'movie', 'ova'].includes(t)) {
        return t as AnimeType;
      } else {
        return 'tv';
      }
    }
  })
  .option('--raw', 'Print raw magnets')
  .option('--index', 'Index magnet database')
  .option('-y, --year [year]')
  .option('-m, --month [month]')
  .option('-p, --plan', 'Output plan.yaml')
  .action(async (anime, option) => {
    const { userSearch } = await import('../anime');
    if (option.index) {
      await context.magnetStore.index({ listener: IndexListener });
    }
    await userSearch(anime, option);
  });

app
  .command(
    'fetch <id> <title> [...keywords]',
    'Fetch resources using Bangumi ID'
  )
  .option('--raw', 'Print raw magnets')
  .option('--index', 'Index magnet database')
  .option('-p, --plan', 'Output plan.yaml')
  .action(async (id, title, anime, option) => {
    const { daemonSearch } = await import('../anime');
    if (option.index) {
      await context.magnetStore.index({ listener: IndexListener });
    }
    await daemonSearch(id, [title, ...anime], {
      ...option,
      title,
      type: 'tv' as 'tv'
    });
  });
