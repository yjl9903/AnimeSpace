import path from 'path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

import { makeSystem } from '../src';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

describe('introspect', () => {
  it('should work', async () => {
    const root = path.join(__dirname, '../../core/test/fixtures/space');
    const system = await makeSystem(root);
    await system.introspect();
  });
});
