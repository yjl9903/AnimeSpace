import createDebug from 'debug';
import { lightRed } from '@breadc/color';

import {
  AnimeSystemError,
  onUncaughtException,
  onUnhandledRejection
} from '@animespace/core';

import { makeCliApp, makeSystem } from './system';

const debug = createDebug('anime');

export async function bootstrap() {
  const handle = (error: unknown) => {
    if (error instanceof AnimeSystemError) {
      console.error(lightRed('Anime System ') + error.detail);
    } else if (error instanceof Error) {
      console.error(lightRed('Unknown ') + error.message);
    } else {
      console.error(error);
    }
    debug(error);
  };

  process.setMaxListeners(256);
  onUncaughtException(handle);
  onUnhandledRejection(handle);

  try {
    const system = await makeSystem();
    const app = await makeCliApp(system);
    await app.run(process.argv.slice(2));
  } catch (error: unknown) {
    handle(error);
    process.exit(1);
  }
}

bootstrap();
