import { describe, expect, it } from 'vitest';

import { PrismaClient } from '@animepaste/database';

describe('database', () => {
  it('should work', async () => {
    const client = new PrismaClient();
    expect(await client.resource.findMany()).toMatchInlineSnapshot('[]');
  });
});
