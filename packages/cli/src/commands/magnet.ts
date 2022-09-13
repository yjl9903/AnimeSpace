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

const NUM_RE = /^[pP]?(\d+)$/;
const PAGE_SIZE = 80;

app
  .command('magnet list <keyword/page>', 'List magnet resource')
  .alias('magnet ls')
  .action(async (keyword) => {
    const match = NUM_RE.exec(keyword);
    const magnets = match
      ? await context.magnetStore.list({
          skip: (+match[1] - 1) * PAGE_SIZE,
          take: PAGE_SIZE
        })
      : await context.magnetStore.search(keyword);
    magnets.sort((a, b) => a.title.localeCompare(b.title));
    for (const item of magnets) {
      logger.println(
        `${DOT} ${link(item.title, context.magnetStore.idToLink(item.id))}`
      );
    }
  });
