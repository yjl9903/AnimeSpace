import { breadc } from 'breadc';

import { context } from '../context';
import { getVersion } from './utils';

const app = breadc('anime', {
  version: getVersion(),
  description: 'Paste your favourite anime online.',
  plugins: [
    {
      onPreCommand: {
        '*': async (result) => {
          // await context.init(option);
          await context.init({ force: result.options.force ?? false });
        }
      }
    }
  ]
}).option('-f, --force', 'Enable force mode and prefer not using cache');

export { app };
