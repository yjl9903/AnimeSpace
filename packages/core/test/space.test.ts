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
    expect(space).toEqual({
      plugins: [
        {
          name: 'animegarden',
          options: {}
        },
        {
          name: 'download',
          options: {
            directory: './download'
          }
        }
      ],
      preference: {
        keywords: {
          order: {
            format: ['mp4', 'mkv'],
            language: ['简', '繁'],
            resolution: ['1080', '720']
          },
          exclude: ['HEVC']
        }
      },
      root,
      storage: path.join(root, 'anime')
    });
  });
});

describe('Create Space', () => {
  const root = path.join(__dirname, `./fixtures/temp`);
  it('should work', async () => {
    const space = await loadSpace(root);
    expect(await loadSpace(root)).toEqual(space);
  });

  beforeEach(async () => {
    await rimraf(root);
  });

  afterEach(async () => {
    await rimraf(root);
  });
});
