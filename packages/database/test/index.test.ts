import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copy, remove } from 'fs-extra';
import { subDays } from 'date-fns';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Database } from '../src';

const dir = path.join(fileURLToPath(import.meta.url), '../..');
const sourceDB = path.join(dir, './prisma/anime.db');
const testDB = path.join(dir, './test/anime.db');

beforeAll(async () => {
  await copy(sourceDB, testDB);
});

afterAll(async () => {
  await remove(testDB);
});

describe('Resource client', () => {
  it('should search', async () => {
    const database = new Database({ url: 'file:' + testDB });
    await database.index({ page: 1 });
    const list = await database.list();
    // console.log(list.map((x) => x.title).join('\n'));
    expect(list).toHaveLength(80);
  });
});
