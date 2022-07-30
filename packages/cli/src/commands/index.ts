import path from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, remove } from 'fs-extra';

import Breadc from 'breadc';
import { debug as createDebug } from 'debug';
import { red, link, green, dim, lightBlue } from 'kolorist';

import type { AnimeType } from '../types';

import { context } from '../context';
import { printVideoInfo } from '../io';
import { logger, IndexListener, padRight, DOT } from '../logger';

const debug = createDebug('anime:cli');

export const cli = Breadc('anime', {
  version: getVersion(),
  description: 'Paste your favourite anime online.',
  logger: { debug }
}).option('-f, --force', 'Enable force mode and prefer not using cache');

cli
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

cli
  .command('plan')
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

cli
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

cli
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

cli
  .command('store list [name]', 'List all uploaded video info')
  .alias('store ls')
  .option('--one-line', 'Only show one line')
  .action(async (name, option) => {
    const { useStore } = await import('../io');
    const store = await useStore('ali')();

    const videos = await store.listLocalVideos();
    videos.sort((a, b) => a.title.localeCompare(b.title));

    const logs: string[] = [];
    const ids: string[] = [];
    for (const info of videos) {
      if (!name || info.title.indexOf(name) !== -1) {
        if (option['one-line']) {
          logs.push(info.videoId);
        } else {
          logs.push(`${info.title}`);
          ids.push(`(${link(info.videoId, info.playUrl[0])})`);
        }
      }
    }

    if (option['one-line']) {
      logger.println(logs.join(' '));
    } else {
      const padded = padRight(logs);
      for (let i = 0; i < padded.length; i++) {
        logger.println(`${DOT} ${padded[i]}  ${ids[i]}`);
      }
    }
  });

cli.command('store info <id>', 'Print video info on OSS').action(async (id) => {
  const { useStore, printVideoInfo } = await import('../io');
  const store = await useStore('ali')();

  const info = await store.fetchVideoInfo(id);

  if (info) {
    printVideoInfo(info);
  } else {
    logger.println(`${red(`✗ video "${id}" not found`)}`);
  }
});

cli
  .command('store put <file>', 'Upload video to OSS')
  .action(async (filename) => {
    const { useStore, printVideoInfo } = await import('../io');
    const store = await useStore('ali')();

    try {
      const info = await store.upload(path.resolve(filename));
      if (info) {
        printVideoInfo(info);
      } else {
        throw new Error();
      }
    } catch (error) {
      logger.empty();
      logger.println(`${red('✗ Fail')} uploading ${filename}`);
    }
  });

cli
  .command('store remove [...ids]', 'Remove video info on OSS')
  .alias('store rm')
  .option('--local', 'Remove local videos')
  .action(async (ids, option) => {
    const { useStore } = await import('../io');
    const store = await useStore('ali')();

    for (const id of ids) {
      const info = await store.fetchVideoInfo(id);

      logger.empty();
      if (info) {
        printVideoInfo(info);
        await store.deleteVideo(info.videoId);
        logger.println(`${green(`✓ Delete    ${info.videoId}`)}`);
      } else {
        logger.println(`${red(`✗ Video     ${id} is not found`)}`);
      }

      if (option.local && info?.source.directory) {
        const filepath = context.decodePath(info?.source.directory, info.title);
        await remove(filepath);
        logger.println(`${green(`✓ Delete    ${filepath}`)}`);
      }
    }
  });

cli
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

cli
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

cli.command('video info <file>', 'Check video info').action(async (file) => {
  const { getVideoInfo } = await import('../video');
  const info = await getVideoInfo(file);
  console.log(JSON.stringify(info, null, 2));
});

cli
  .command('user create', 'Create a new token')
  .option('--comment [comment]', 'Comment of the new token')
  .option('--type [type]', 'One of admin or user')
  .action(async (option) => {
    const { AdminClient } = await import('../client');
    const client = await AdminClient.create();
    const token = await client.createToken({
      comment: option.comment,
      type: option.type === 'admin' ? 'admin' : 'user'
    });
    if (token) {
      logger.println(`${green(`✓ Create token OK`)}`);
      logger.tab.println(`${dim('Token')}   ${token.token}`);
      logger.tab.println(`${dim('Type')}    ${token.type}`);
      logger.tab.println(
        `${dim('Comment')} ${token.comment ? token.comment : '(Empty)'}`
      );
    } else {
      logger.println(`${red(`✗ Create token fail`)}`);
    }
  });

cli
  .command('user list', 'List user tokens')
  .alias('user ls')
  .action(async () => {
    const { AdminClient } = await import('../client');
    const client = await AdminClient.create();
    const tokens = await client.listToken();
    if (tokens.length > 0) {
      logger.println(`${green(`✓ There are ${tokens.length} tokens`)}`);
      for (const token of tokens) {
        const comment =
          token.type === 'visitor' && token.access?.length
            ? dim(`(IP: ${token.access[0].ip})`)
            : !!token.comment
            ? dim(`(Comment: ${token.comment})`)
            : '';
        logger.println(
          `${DOT} ${lightBlue(token.type)} ${token.token} ${comment}`
        );
      }
    }
  });

cli
  .command('user remove [token]', 'Remove user tokens')
  .alias('user rm')
  .option('--visitor', 'Clear all the visitor tokens')
  .action(async (token, option) => {
    const { AdminClient } = await import('../client');
    const client = await AdminClient.create();
    if (option.visitor) {
      const tokens = await client.removeVisitors();
      if (tokens !== undefined) {
        logger.println(`${green(`✓ Remove ${tokens.length} visitor tokens`)}`);
        if (tokens.length > 0) {
          for (const token of tokens) {
            logger.println(`${DOT} ${token}`);
          }
        }
      } else {
        logger.println(`${red(`✗ Remove visitor tokens fail`)}`);
      }
    } else if (token) {
      const ok = await client.removeToken(token);
      if (ok) {
        logger.println(`${green(`✓ Remove ${token}`)}`);
      } else {
        logger.println(`${red(`✗ Remove ${token} fail`)}`);
      }
    }
  });

cli
  .command('space', 'Open AnimePaste space directory and run script on it')
  .action(async (option) => {
    const cmd = option['--'];
    if (cmd.length > 0) {
      execSync(cmd.join(' '), {
        cwd: context.root,
        env: process.env,
        stdio: ['inherit', 'inherit', 'inherit']
      });
    } else {
      console.log(context.root);
      execSync(`code "${context.root}"`, {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });
    }
  });

function getVersion(): string {
  const pkg = path.join(__dirname, '../package.json');
  if (existsSync(pkg)) {
    return JSON.parse(readFileSync(pkg, 'utf-8')).version;
  } else {
    return JSON.parse(
      readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
    ).version;
  }
}
