import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Prisma from '@prisma/client';

export interface DatabaseOption {
  url?: string;
}

export abstract class AbstractDatabase {
  private static DefaultFilepath = path.join(
    fileURLToPath(import.meta.url),
    '../../prisma/anime.db'
  );

  protected readonly filepath: string;
  protected readonly prisma: Prisma.PrismaClient;

  constructor(option: DatabaseOption = {}) {
    if (option.url) {
      this.filepath = option.url;
      this.prisma = new Prisma.PrismaClient({
        datasources: { db: { url: 'file:' + option.url } }
      });
    } else {
      this.filepath = AbstractDatabase.DefaultFilepath;
      this.prisma = new Prisma.PrismaClient();
    }
  }

  async ensure() {
    if (!fs.existsSync(this.filepath)) {
      await fs.promises.copyFile(
        AbstractDatabase.DefaultFilepath,
        this.filepath
      );
    }
  }
}
