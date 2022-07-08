import createDebug from 'debug';
import { subMonths, isBefore } from 'date-fns';
import { PrismaClient, Prisma, Resource } from '@prisma/client';

import { sleep } from './utils';
import { fetchResource } from './fetch';

const debug = createDebug('anime:database');

export interface DatabaseOption {
  url?: string;
}

export interface IndexOption {
  /**
   * Index stop date
   *
   * @default 'subMonths(new Date(), 6)'
   */
  limit?: Date;

  /**
   * Fetch page limit
   *
   * @default 'undefined'
   */
  page?: number;

  /**
   * Break when page found
   *
   * @default 'true'
   */
  earlyStop?: boolean;
}

export class Database {
  private readonly prisma = new PrismaClient();

  constructor(option: DatabaseOption) {
    if (option.url) {
      this.prisma = new PrismaClient({
        datasources: { db: { url: option.url } }
      });
    }
  }

  async index({
    limit = subMonths(new Date(), 6),
    page: pageLimit,
    earlyStop = true
  }: IndexOption = {}) {
    for (let page = 1; !pageLimit || page <= pageLimit; page++) {
      const payloads = await fetchResource(page);
      let stop = false;
      let inserted = false;
      for (const p of payloads) {
        const createdAt = new Date(p.createdAt);
        if (isBefore(createdAt, limit)) {
          stop = true;
          break;
        }
        const ok = await this.createResource(p);
        if (ok) inserted = true;
      }
      if (stop || (earlyStop && !inserted)) {
        break;
      }
      await sleep();
    }
  }

  async search(keyword: string | string[]) {
    const keywords = typeof keyword === 'string' ? [keyword] : keyword;
    const result = await this.prisma.resource.findMany({
      where: {
        OR: keywords.map((w) => ({ title: { contains: w } }))
      }
    });
    return result;
  }

  async createResource(payload: Prisma.ResourceCreateInput) {
    try {
      return await this.prisma.resource.create({ data: payload });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          debug(
            `There is a unique constraint violation when inserting resource`
          );
          debug(`Title: ${payload.title}`);
        }
      }
    }
  }

  async createResources(
    payloads: Prisma.ResourceCreateInput[]
  ): Promise<Resource[]> {
    return (
      await Promise.all(payloads.map((p) => this.createResource(p)))
    ).filter(Boolean) as Resource[];
  }

  async list() {
    return await this.prisma.resource.findMany();
  }

  async destroy() {
    await this.prisma.$disconnect();
  }
}
