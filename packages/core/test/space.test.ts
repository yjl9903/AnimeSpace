import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rimraf } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadSpace, loadPlans } from '../src';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('Load Space', () => {
  it('should work', async () => {
    const root = path.join(__dirname, './fixtures/space');
    const space = await loadSpace(root);

    expect(space).toMatchSnapshot();
    expect(await loadPlans(space)).toMatchSnapshot();
  });
});

describe('Create Space', () => {
  const root = path.join(__dirname, `./fixtures/temp`);
  it('should work', async () => {
    const space = await loadSpace(root);
    const loaded = await loadSpace(root);

    expect(loaded).toMatchSnapshot();
    expect(await loadPlans(loaded)).toEqual(await loadPlans(space));
  });

  beforeEach(async () => {
    await rimraf(root);
  });

  afterEach(async () => {
    await rimraf(root);
  });
});
