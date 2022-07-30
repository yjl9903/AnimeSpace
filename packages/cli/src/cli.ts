import path from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, remove } from 'fs-extra';

import Breadc from 'breadc';
import { debug as createDebug } from 'debug';
import { lightRed, red, link, green, dim, lightBlue } from 'kolorist';

import type { AnimeType } from './types';

import { context } from './context';
import { printVideoInfo } from './io';
import { IndexListener, printMagnets, padRight } from './logger';

const name = 'anime';

const debug = createDebug(name + ':cli');

const cli = Breadc(name, {
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
    const { startDaemon } = await import('./daemon');
    await startDaemon(option);
  });

cli
  .command('plan')
  .option('--type [type]', 'One of local or server')
  .action(async (option) => {
    const { Plan } = await import('./daemon');
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
    const { userSearch } = await import('./anime');
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
    const { daemonSearch } = await import('./anime');
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
    const { useStore } = await import('./io');
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
          logs.push(`  ${info.title}`);
          ids.push(`(${link(info.videoId, info.playUrl[0])})`);
        }
      }
    }

    if (option['one-line']) {
      console.log(logs.join(' '));
    } else {
      const padded = padRight(logs);
      for (let i = 0; i < padded.length; i++) {
        console.log(`${padded[i]}  ${ids[i]}`);
      }
    }
  });

cli
  .command('store get <id>', 'View video info on OSS')
  .option('--file', 'Use videoId instead of filepath')
  .action(async (id, option) => {
    const { useStore, printVideoInfo } = await import('./io');
    const store = await useStore('ali')();

    const info = !option.file
      ? await store.fetchVideoInfo(id)
      : await store.searchLocalVideo(id);

    if (info) {
      printVideoInfo(info);
    } else {
      console.log(`  ${red(`✗ video "${id}" not found`)}`);
    }
  });

cli
  .command('store put <file>', 'Upload video to OSS')
  .action(async (filename) => {
    const { useStore, printVideoInfo } = await import('./io');
    const store = await useStore('ali')();

    try {
      const info = await store.upload(path.resolve(filename));
      if (info) {
        printVideoInfo(info);
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log();
      console.log(`  ${red('✗ Fail')} uploading ${filename}`);
    }
  });

cli
  .command('store remove [...ids]', 'Remove video info on OSS')
  .alias('store rm')
  .option('--file', 'Use filepath instead of videoId')
  .option('--rm-local', 'Remove local files')
  .action(async (ids, option) => {
    const { useStore } = await import('./io');
    const store = await useStore('ali')();

    for (const id of ids) {
      const info = !option.file
        ? await store.fetchVideoInfo(id)
        : await store.searchLocalVideo(id);

      if (option['rm-local'] && info?.source.directory) {
        const filepath = context.decodePath(info?.source.directory);
        await remove(filepath);
      }

      console.log();
      if (info) {
        printVideoInfo(info);
        await store.deleteVideo(info.videoId);
        console.log(`  ${green(`✓ Delete    ${info.videoId} Ok`)}`);
      } else {
        console.log(`  ${red(`✗ Video     ${id} is not found`)}`);
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
    const list = await context.magnetStore.search(keyword);
    printMagnets(list, '');
  });

cli.command('video info <file>', 'Check video info').action(async (file) => {
  const { getVideoInfo } = await import('./video');
  const info = await getVideoInfo(file);
  console.log(JSON.stringify(info, null, 2));
});

cli
  .command('user create', 'Create a new token')
  .option('--comment [comment]', 'Comment of the new token')
  .option('--type [type]', 'One of admin or user')
  .action(async (option) => {
    const { AdminClient } = await import('./client');
    const client = await AdminClient.create();
    const token = await client.createToken({
      comment: option.comment,
      type: option.type === 'admin' ? 'admin' : 'user'
    });
    if (token) {
      console.log(`  ${green(`✓ Create token OK`)}`);
      console.log(`    ${dim('Token')}   ${token.token}`);
      console.log(`    ${dim('Type')}    ${token.type}`);
      console.log(
        `    ${dim('Comment')} ${token.comment ? token.comment : '(Empty)'}`
      );
    } else {
      console.log(`  ${red(`✗ Create token fail`)}`);
    }
  });

cli
  .command('user list', 'List user tokens')
  .alias('user ls')
  .action(async () => {
    const { AdminClient } = await import('./client');
    const client = await AdminClient.create();
    const tokens = await client.listToken();
    if (tokens.length > 0) {
      console.log(`  ${green(`✓ There are ${tokens.length} tokens`)}`);
      for (const token of tokens) {
        const comment =
          token.type === 'visitor' && token.access?.length
            ? dim(`(IP: ${token.access[0].ip})`)
            : !!token.comment
            ? dim(`(Comment: ${token.comment})`)
            : '';
        console.log(
          `  ${dim('•')} ${lightBlue(token.type)} ${token.token} ${comment}`
        );
      }
    }
  });

cli
  .command('user remove [token]', 'Remove user tokens')
  .alias('user rm')
  .option('--visitor', 'Clear all the visitor tokens')
  .action(async (token, option) => {
    const { AdminClient } = await import('./client');
    const client = await AdminClient.create();
    if (option.visitor) {
      const tokens = await client.removeVisitors();
      if (tokens !== undefined) {
        console.log(`  ${green(`✓ Remove ${tokens.length} visitor tokens`)}`);
        if (tokens.length > 0) {
          for (const token of tokens) {
            console.log(`  ${dim('•')} ${token}`);
          }
        }
      } else {
        console.log(`  ${red(`✗ Remove visitor tokens fail`)}`);
      }
    } else if (token) {
      const ok = await client.removeToken(token);
      if (ok) {
        console.log(`  ${green(`✓ Remove ${token}`)}`);
      } else {
        console.log(`  ${red(`✗ Remove ${token} fail`)}`);
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

export async function bootstrap() {
  const handle = (error: unknown) => {
    if (error instanceof Error) {
      console.error(lightRed('  Error ') + error.message);
    } else {
      console.error(error);
    }
    debug(error);
  };

  process.setMaxListeners(128);
  process.on('unhandledRejection', (error) => {
    debug(error);
  });

  try {
    cli.on('pre', async (option) => {
      await context.init(option);
    });
    await cli.run(process.argv.slice(2));
    process.exit(0);
  } catch (error: unknown) {
    handle(error);
    process.exit(1);
  }
}

bootstrap();
