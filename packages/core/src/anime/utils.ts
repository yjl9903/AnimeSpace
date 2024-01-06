import { format } from 'date-fns';
import { Document, visit } from 'yaml';

import type { LocalLibrary } from './types';

export function stringifyLocalLibrary(lib: LocalLibrary, rawLib?: Partial<LocalLibrary>) {
  const copied: LocalLibrary = JSON.parse(JSON.stringify(lib));
  if (rawLib?.title === undefined) {
    // @ts-ignore
    copied.title = undefined;
  }
  if (rawLib?.date === undefined) {
    // @ts-ignore
    copied.date = undefined;
  }
  if (rawLib?.season === undefined) {
    copied.season = undefined;
  }
  if (copied.videos === undefined) {
    copied.videos = [];
  }
  for (const v of copied.videos) {
    if (v.naming === 'auto') {
      // @ts-ignore
      v.naming = undefined;
    }
  }

  const doc = new Document(copied);

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
