import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSpace, createAnimeSystem } from '@animespace/core';

import { Aria2Client } from '../src/download/aria2';

const root = path.join(
  fileURLToPath(import.meta.url),
  '../../../core/test/fixtures/space'
);
const space = await loadSpace(root);
const system = await createAnimeSystem(space);

const client = new Aria2Client(system);

await client.start();

await client.close();
