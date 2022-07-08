import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copy, remove } from 'fs-extra';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Database } from '../src';

describe('Resource client', () => {
  it('should search', async () => {
    const database = new Database({ url: 'file:./anime.db' });
    expect(await database.list()).toMatchInlineSnapshot('[]');
  });
});

const dir = path.join(fileURLToPath(import.meta.url), '../..');
const sourceDB = path.join(dir, './prisma/anime.db');
const testDB = path.join(dir, './test/anime.db');

beforeAll(async () => {
  await copy(sourceDB, testDB);
});

afterAll(async () => {
  await remove(testDB);
});
