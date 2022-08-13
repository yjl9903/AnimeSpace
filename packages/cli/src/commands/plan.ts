import * as path from 'node:path';

import { dim, link } from 'kolorist';

import type { AnimeType } from '../types';

import { context } from '../context';
import { formatEpisodeName, formatEP, filterDef } from '../utils';
import { logger, IndexListener, okColor, titleColor } from '../logger';

import { app } from './app';
import { promptConfirm } from './utils';

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

app.command('plan onair', 'Preview onair plan').action(async () => {
  const { Plan } = await import('../daemon');
  const plan = await Plan.create();
  plan.printOnair();
});

app
  .command('plan download <anime>', 'Download remote videos from OSS')
  .alias('plan down')
  .option('--id', 'Use bgmId instead of name')
  .action(async (name, option) => {
    const { download } = await import('../io');
    const { Plan } = await import('../daemon');
    const { bangumiLink } = await import('../anime');
    const { AdminClient } = await import('../client');

    if (/^\d+$/.test(name)) {
      option.id = true;
    }

    const client = await AdminClient.init();
    const plans = await Plan.create();

    const findFn = (o: { bgmId: string; title: string }) => {
      if (option.id) {
        return o.bgmId === name;
      } else {
        return o.title.indexOf(name) !== -1;
      }
    };
    const plan = plans.onairs().find(findFn);
    const onair = client.onair.find(findFn);

    if (onair && plan) {
      const anime = await context.getAnime(plan.bgmId);

      if (anime) {
        const localRoot = await context.makeLocalAnimeRoot(onair.title);
        const tasks = filterDef(
          onair.episodes.map((onairEp) => {
            if ('storage' in onairEp) {
              const ep = anime.episodes.find(
                (ep) => ep.magnetId === onairEp.storage.source.magnetId
              );
              if (ep) {
                return {
                  filepath: path.join(
                    localRoot,
                    formatEpisodeName(plan?.format, anime, ep)
                  ),
                  url: onairEp.playURL,
                  ep
                };
              } else {
                // Local episodes not found
                return undefined;
              }
            } else {
              // Online Episodes
              return undefined;
            }
          })
        );

        logger.println(
          `${okColor('Download')} ${titleColor(anime.title)}    (${bangumiLink(
            anime.bgmId
          )})`
        );
        for (const task of tasks) {
          logger.println(
            `  ${dim(formatEP(task.ep.ep))} ${link(
              path.basename(task.filepath),
              task.url
            )}`
          );
        }

        if (
          await promptConfirm(
            `Are you sure to download these ${tasks.length} videos`
          )
        ) {
          await download(...tasks);
          logger.println(
            `${okColor('Download')} ${titleColor(anime.title)} ${okColor(
              'OK'
            )} (${bangumiLink(anime.bgmId)})`
          );
        }
      }
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
