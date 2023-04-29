import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rimraf } from 'rimraf';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { loadSpace } from '../src';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('Load Space', () => {
  it('should work', async () => {
    const root = path.join(__dirname, './fixtures/space');
    const space = await loadSpace(root);
    expect({ ...space, plans: undefined }).toEqual({
      plugins: [],
      preference: {
        format: {
          include: ['mp4', 'mkv'],
          exclude: []
        },
        keyword: {
          order: {
            format: ['mp4', 'mkv'],
            language: ['简', '繁'],
            resolution: ['1080', '720']
          },
          exclude: []
        },
        fansub: {
          order: [],
          exclude: []
        }
      },
      root,
      storage: path.join(root, 'anime')
    });
    expect(await space.plans()).toEqual([]);
  });
});

describe('Create Space', () => {
  const root = path.join(__dirname, `./fixtures/temp`);
  it('should work', async () => {
    const space = await loadSpace(root);
    const loaded = await loadSpace(root);
    expect({ ...loaded, plans: undefined }).toEqual({
      ...space,
      plans: undefined
    });
    expect(await loaded.plans()).toEqual(await space.plans());
  });

  beforeEach(async () => {
    await rimraf(root);
  });

  afterEach(async () => {
    await rimraf(root);
  });
});
