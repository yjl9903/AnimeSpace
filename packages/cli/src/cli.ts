import path from 'node:path';
import { spawnSync } from 'node:child_process';

import Breadc from 'breadc';
import { lightRed, green, red } from 'kolorist';
import { debug as createDebug } from 'debug';

import { version } from '../package.json';

import { useStore } from './io';
import { GlobalContex } from './context';

const name = 'anime';

const debug = createDebug(name + ':cli');

const cli = Breadc(name, { version, logger: { debug } });

cli
  .command('store info <filename>', 'View video info on OSS')
  .action(async (filename) => {
    const context = new GlobalContex();
    await context.init();
    const createStore = useStore('ali');
    const store = await createStore(context);

    await store.fetchVideoInfo(filename);
  });

cli
  .command('store upload <filename>', 'Upload video to OSS')
  .option('--title [title]', 'Video title')
  .action(async (filename, option) => {
    const context = new GlobalContex();
    await context.init();
    const createStore = useStore('ali');
    const store = await createStore(context);

    const payload = {
      filepath: path.resolve(process.cwd(), filename),
      title: option.title ?? path.basename(filename)
    };
    try {
      await store.upload(payload);
      console.log(` ${green('√ Success')}`);
    } catch (error) {
      console.log(` ${red('✗ Fail')}`);
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
