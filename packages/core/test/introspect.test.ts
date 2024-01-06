import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createSystem, loadSpace } from '../src';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('Introspect', () => {
  it('should work', async () => {
    const root = path.join(__dirname, './fixtures/space');
    const space = await loadSpace(root, async (entry) => {
      return undefined;
    });
    const system = await createSystem(space);
    const animes = await system.introspect();
    expect(await Promise.all(animes.map((a) => a.library()))).toMatchSnapshot();
    expect(await Promise.all(animes.map((a) => a.list()))).toMatchSnapshot();
  });
});
