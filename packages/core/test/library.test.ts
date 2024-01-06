import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { LocalLibrary } from '../src';

import { Document, visit } from 'yaml';
import { format } from 'date-fns';

describe('Library', () => {
  it('should work', async () => {
    const content = stringifyLocalLibrary({
      title: '123',
      season: 1,
      date: new Date('2022-04-01T04:00:00.000Z'),
      videos: [
        { filename: '456', naming: 'auto', source: { type: 'Local' } },
        { filename: '789', naming: 'auto', source: { type: 'Local' } }
      ]
    });
    expect(content.split('\n').slice(1).join('\n')).toMatchInlineSnapshot(`
      "
      title: "123"

      season: 1

      date: 2022-04-01T04:00:00.000Z

      videos:
        - filename: "456"
          naming: auto
          source:
            type: Local

        - filename: "789"
          naming: auto
          source:
            type: Local
      "
    `);
  });
});

function stringifyLocalLibrary(lib: LocalLibrary) {
  const doc = new Document(lib);

  visit(doc, {
    Scalar(key, node) {
      if (key === 'key') {
        node.spaceBefore = true;
      }
    },
    Seq(key, node) {
      let first = true;
      for (const child of node.items) {
        if (first) {
          first = false;
          continue;
        }
        // @ts-ignore
        child.spaceBefore = true;
      }
      return visit.SKIP;
    }
  });

  return (
    `# Generated at ${format(new Date(), 'yyyy-MM-dd hh:mm')}\n` + doc.toString({ lineWidth: 0 })
  );
}
