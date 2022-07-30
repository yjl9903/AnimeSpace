import createDebug from 'debug';
import { lightRed } from 'kolorist';

import { cli } from './commands';
import { context } from './context';

const debug = createDebug('anime:cli');

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
