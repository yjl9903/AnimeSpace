import { link } from 'kolorist';

import { context } from '../context';
import { logger, IndexListener, DOT } from '../logger';

import { app } from './app';

app
  .command('magnet index', 'Index magnet database')
  .alias('index')
  .option('--limit [date]', 'Stop at this date')
  .option('--page [page]', 'Start indexing at this page', {
    construct(t) {
      return t ? +t : 1;
    }
  })
  .action(async (option) => {
    await context.magnetStore.index({
      limit: option.limit ? new Date(option.limit) : undefined,
      startPage: option.page,
      earlyStop: !option.force,
      listener: IndexListener
    });
  });

app
  .command('magnet list <keyword>', 'Search magnet database')
  .alias('magnet ls')
  .action(async (keyword) => {
    const magnets = await context.magnetStore.search(keyword);
    magnets.sort((a, b) => a.title.localeCompare(b.title));
    for (const item of magnets) {
      logger.println(
        `${DOT} ${link(item.title, context.magnetStore.idToLink(item.id))}`
      );
    }
  });
