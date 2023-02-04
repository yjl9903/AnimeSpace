import * as path from 'node:path';

import { bold, dim, link } from 'kolorist';

import type { AnimeType } from '../types';

import { context } from '../context';
import { formatEpisodeName, formatEP, filterDef } from '../utils';
import { logger, IndexListener, okColor, titleColor } from '../logger';

import { app } from './app';
import { promptConfirm } from './utils';

export default function setup() {
  app
    .command('watch', 'Watch anime resources update')
    .option('-i, --interval <duration>', 'Damon interval in minutes', {
      default: '10',
      cast: (t) => +t
    })
    .option('-o, --once', 'Just do an immediate update')
    .option('--index', 'Enable index resource', { default: true })
    .option('--upload', 'Enable upload videos to OSS', { default: true })
    .option('--sync', 'Enable sync onair with the server', { default: true })
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
    .command('plan magnet [anime]', 'Refresh magnet list')
    .action(async (anime) => {
      const { createDaemon } = await import('../daemon');
      logger.config.level = false;
      const daemon = createDaemon();

      await daemon.initPlan({ log: false });
      await daemon.initClient();
      await daemon.refreshEpisode({
        filter: anime
          ? (o) => o.bgmId === anime || o.title.indexOf(anime) !== -1
          : undefined
      });
    });

  app
    .command('plan download <anime>', 'Download remote videos from OSS')
    .alias('plan down')
    .option('--id', 'Use bgmId instead of name')
    .action(async (name, option) => {
      const { Plan } = await import('../daemon');
      const { download } = await import('../io');
      const { initClient } = await import('../client');
      const { bangumiLink } = await import('../anime');

      if (/^\d+$/.test(name)) {
        option.id = true;
      }

      const client = await initClient();
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
        const episodes = await context.episodeStore.listEpisodes(onair.bgmId);

        const localRoot = await context.makeLocalAnimeRoot(onair.title);
        const tasks = filterDef(
          onair.episodes.map((onairEp) => {
            if ('storage' in onairEp) {
              const ep = episodes.find(
                (ep) => ep.magnet.id === onairEp.storage.source.magnetId
              );
              if (ep) {
                return {
                  filepath: path.join(localRoot, formatEpisodeName(plan, ep)),
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
          `${okColor('Download')} ${titleColor(onair.title)}    (${bangumiLink(
            onair.bgmId
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
            `${okColor('Download')} ${titleColor(onair.title)} ${okColor(
              'OK'
            )} (${bangumiLink(onair.bgmId)})`
          );
        }
      }
    });

  app
    .command('search [anime]', 'Search Bangumi resources')
    .option('--type <type>', {
      default: 'tv',
      cast(t) {
        if (t && ['tv', 'web', 'movie', 'ova'].includes(t)) {
          return t as AnimeType;
        } else {
          return 'tv';
        }
      }
    })
    .option('--raw', 'Print raw magnets')
    .option('--index', 'Index magnet database')
    .option('--year <year>')
    .option('--month <month>')
    .option('-p, --plan', 'Output plan.yaml')
    .action(async (anime, option) => {
      const { userSearch } = await import('../anime');
      if (option.index) {
        await context.magnetStore.index({ listener: IndexListener });
      }
      logger.config.level = false;
      await userSearch(anime, option);
    });

  app
    .command('fetch <id> [...keywords]', 'Fetch resources using Bangumi ID')
    .option('--raw', 'Print raw magnets')
    .option('--index', 'Index magnet database')
    .option('-p, --plan', 'Output plan.yaml')
    .action(async (id, keywords, option) => {
      const { daemonSearch } = await import('../anime');
      if (option.index) {
        await context.magnetStore.index({ listener: IndexListener });
      }

      const { BgmClient } = await import('@animepaste/bangumi/bgm');
      const { getBgmLink } = await import('@animepaste/bangumi/utils');
      const client = new BgmClient();
      client.setupUserAgent();

      const bgm = await client.fetchSubject(id);
      {
        logger.println(
          `${bold('Title')} ${link(bgm.titleCN, getBgmLink(bgm.bgmId))}`
        );
        logger.println(`${bold('Begin')} ${bgm.begin}`);
      }

      logger.config.level = false;
      await daemonSearch(id, [bgm.title, bgm.titleCN, ...keywords], {
        ...option,
        title: bgm.titleCN,
        type: 'tv' as 'tv'
      });
    });
}
