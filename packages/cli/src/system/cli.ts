import { breadc } from 'breadc';
import { AnimeSystem } from '@animepaste/core';

import { version, description } from '../../package.json';

export async function makeCliApp(system: AnimeSystem) {
  const app = breadc('anime', { version, description });
  return app;
}
