import path from 'node:path';
import { existsSync, readFileSync } from 'fs-extra';
import { spawnSync } from 'node:child_process';

import Breadc from 'breadc';
import { lightRed, green, red, link } from 'kolorist';
import { debug as createDebug } from 'debug';

import type { AnimeType } from './types';

import { context } from './context';
import { padRight, printVideoInfo } from './utils';

const name = 'anime';

const debug = createDebug(name + ':cli');

const cli = Breadc(name, { version: getVersion(), logger: { debug } }).option(
  '--force'
);

cli
  .command('watch', 'Watch anime resources update')
  .option('-i, --interval [duration]', 'Damon interval in minutes', {
    construct(t) {
      return t ? +t : 60;
    }
  })
  .option('-o, --once', 'Just do an immediate update')
  .option('--update', 'Only update info')
  .action(async (option) => {
    const { startDaemon } = await import('./daemon');
    await startDaemon(option);
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
  .option('--id [bgmId]', 'Search keywords with Bangumi ID')
  .option('--raw', 'Print raw magnets')
  .option('-y, --year [year]')
  .option('-m, --month [month]')
  .option('-p, --plan', 'Output plan.yaml')
  .action(async (anime, option) => {
    const { userSearch, daemonSearch } = await import('./anime');
    if (option.id && anime) {
      await daemonSearch(option.id, anime.split(','), option);
    } else {
      await userSearch(anime, option);
    }
  });

cli
  .command('store ls [name]', 'List all uploaded video info')
  .option('--one-line', 'Only show one line')
  .action(async (name, option) => {
    const { useStore } = await import('./io');
    const createStore = useStore('ali');
    const store = await createStore(context);

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
    const { useStore } = await import('./io');
    const createStore = useStore('ali');
    const store = await createStore(context);

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
  .option('--title [title]', 'Video title')
  .action(async (filename, option) => {
    const { useStore } = await import('./io');
    const createStore = useStore('ali');
    const store = await createStore(context);

    const newFile = await context.copy(
      path.resolve(process.cwd(), filename),
      'cache'
    );
    const payload = {
      filepath: newFile,
      title: option.title ?? path.basename(newFile)
    };
    try {
      const info = await store.upload(payload);
      if (info) {
        printVideoInfo(info);
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log();
      console.log(`  ${red('✗ Fail')}`);
    }
  });

cli
  .command('store rm [...ids]', 'Remove video info on OSS')
  .option('--file', 'Use videoId instead of filepath')
  .action(async (ids, option) => {
    const { useStore } = await import('./io');
    const createStore = useStore('ali');
    const store = await createStore(context);

    for (const id of ids) {
      const info = !option.file
        ? await store.fetchVideoInfo(id)
        : await store.searchLocalVideo(id);

      console.log();
      if (info) {
        printVideoInfo(info);
        await store.deleteVideo(info.videoId);
        console.log(`  ${green(`√ Delete "${info.videoId}" Ok`)}`);
      } else {
        console.log(`  ${red(`✗ Video "${id}" not found`)}`);
      }
    }
  });

cli.command('space', 'Open AnimePaste space directory').action(async () => {
  console.log(context.root);
  spawnSync(`code ${context.root}`, {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
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

async function bootstrap() {
  const handle = (error: unknown) => {
    if (error instanceof Error) {
      console.error(lightRed('  Error ') + error.message);
    } else {
      console.error(error);
    }
    debug(error);
  };

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
