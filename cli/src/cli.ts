import Breadc from 'breadc';
import { lightRed } from 'kolorist';
import { debug as createDebug } from 'debug';

import { version } from '../package.json';

import { CliOption } from './types';

const name = 'anime';

const debug = createDebug(name + ':cli');

const cli = Breadc(name, { version, logger: { debug } });

cli.command('').action(async (_option: CliOption) => {
  console.log('Hello world');
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
