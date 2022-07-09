import { describe, expect, it } from 'vitest';

import { MagnetStore } from '@animepaste/database';

describe('database', () => {
  it('should work', async () => {
    const client = new MagnetStore();
    expect(await client.list()).toMatchInlineSnapshot('[]');
  });
});
