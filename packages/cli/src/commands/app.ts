import Breadc from 'breadc';

import { debug, getVersion } from './utils';

const app = Breadc('anime', {
  version: getVersion(),
  description: 'Paste your favourite anime online.',
  logger: { debug }
}).option('-f, --force', 'Enable force mode and prefer not using cache');

export { app };
