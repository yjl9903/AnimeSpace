import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rimraf } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadSpace, loadPlans } from '../src';
import { fs as LocalFS } from 'breadfs/node';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('Load Space', () => {
  it('should work', async () => {
    const root = path.join(__dirname, './fixtures/space');
    const space = await loadSpace(root);

    expect({
      ...space,
      resolvePath: undefined,
      plans: undefined
    }).toMatchInlineSnapshot(`
      {
        "plans": undefined,
        "plugins": [],
        "preference": {
          "extension": {
            "exclude": [],
            "include": [
              "mp4",
              "mkv",
            ],
          },
          "format": {
            "episode": "[{fansub}] {title} - S{season}E{ep}.{extension}",
            "film": "[{fansub}] {title}.{extension}",
            "ova": "[{fansub}] {title}.{extension}",
          },
          "keyword": {
            "exclude": [],
            "order": {
              "format": [
                "mp4",
                "mkv",
              ],
              "language": [
                "简",
                "繁",
              ],
              "resolution": [
                "1080",
                "720",
              ],
            },
          },
        },
        "resolvePath": undefined,
        "root": Path {
          "_fs": BreadFS {
            "provider": NodeProvider {
              "name": "node",
            },
          },
          "_path": "${LocalFS.path(root).toString()}",
        },
        "storage": {
          "anime": Path {
            "_fs": BreadFS {
              "provider": NodeProvider {
                "name": "node",
              },
            },
            "_path": "${LocalFS.path(root, 'anime').toString()}",
          },
          "cache": Path {
            "_fs": BreadFS {
              "provider": NodeProvider {
                "name": "node",
              },
            },
            "_path": "${LocalFS.path(root, 'cache').toString()}",
          },
          "library": Path {
            "_fs": BreadFS {
              "provider": NodeProvider {
                "name": "node",
              },
            },
            "_path": "${LocalFS.path(root, 'anime').toString()}",
          },
        },
      }
    `);

    expect(await loadPlans(space)).toMatchSnapshot();
  });
});

describe('Create Space', () => {
  const root = path.join(__dirname, `./fixtures/temp`);
  it('should work', async () => {
    const space = await loadSpace(root);
    const loaded = await loadSpace(root);
    expect({ ...loaded, resolvePath: undefined, plans: undefined }).toEqual({
      ...space,
      resolvePath: undefined,
      plans: undefined
    });
    expect(await loadPlans(loaded)).toEqual(await loadPlans(space));
  });

  beforeEach(async () => {
    await rimraf(root);
  });

  afterEach(async () => {
    await rimraf(root);
  });
});
