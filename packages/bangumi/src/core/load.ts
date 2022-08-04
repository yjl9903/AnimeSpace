import { createRequire } from 'node:module';

import { decompress } from './utils';

export function load(filename: string) {
  const require = createRequire(import.meta.url);
  const data = require('@animepaste/bangumi/data/' + filename);
  return decompress('default' in data ? data.default : data);
}
