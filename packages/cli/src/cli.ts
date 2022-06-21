import path from 'node:path';
import { spawnSync } from 'node:child_process';

import Breadc from 'breadc';
import { lightRed, green, red } from 'kolorist';
import { debug as createDebug } from 'debug';

import { version } from '../package.json';

import { useStore } from './io';
import { GlobalContex } from './context';
import { printVideoInfo } from './utils';

const name = 'anime';

const debug = createDebug(name + ':cli');

const cli = Breadc(name, { version, logger: { debug } });

cli
  .command('store put <file>', 'Upload video to OSS')
  .option('--title [title]', 'Video title')
  .action(async (filename, option) => {
    const context = new GlobalContex();
    await context.init();
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
        console.log();
        console.log(`  ${green('√ Success')}`);
        console.log();
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
  .command('store get <id>', 'View video info on OSS')
  .option('--file', 'Use videoId instead of filepath')
  .action(async (id, option) => {
    const context = new GlobalContex();
    await context.init();
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
  .command('store del <id>', 'Delete video info on OSS')
  .option('--file', 'Use videoId instead of filepath')
  .action(async (id, option) => {
    const context = new GlobalContex();
    await context.init();
    const createStore = useStore('ali');
    const store = await createStore(context);

    const info = !option.file
      ? await store.fetchVideoInfo(id)
      : await store.searchLocalVideo(id);

    if (info) {
      printVideoInfo(info);
      await store.deleteVideo(info.videoId);
      console.log();
      console.log(`  ${green(`√ Delete "${info.videoId}" Ok`)}`);
    } else {
      console.log(`  ${red(`✗ Video "${id}" not found`)}`);
    }
  });

cli.command('space', 'Open AnimePaste space directory').action(async () => {
  const context = new GlobalContex();
  await context.init();
  console.log(context.root);
  spawnSync(`code ${context.root}`, {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
});

async function bootstrap() {
  const handle = (error: unknown) => {
    if (error instanceof Error) {
      console.error(lightRed('Error: ') + error.message);
    } else {
      console.error(error);
    }
    debug(error);
  };

  process.on('unhandledRejection', (error) => {
    handle(error);
  });

  try {
    await cli.run(process.argv.slice(2));
  } catch (error: unknown) {
    handle(error);
    process.exit(1);
  }
}

bootstrap();
