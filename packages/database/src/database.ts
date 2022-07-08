import { subMonths, isBefore } from 'date-fns';
import { PrismaClient, Prisma } from '@prisma/client';

import { sleep } from './utils';
import { fetchResource } from './search';

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
      for (const p of payloads) {
        const createdAt = new Date(p.createdAt);
        if (isBefore(createdAt, limit)) {
          stop = true;
          break;
        }
        await this.createResource(p);
      }
      if (stop) {
        break;
      }
      await sleep();
    }
  }

  async createResource(payload: Prisma.ResourceCreateInput) {
    return await this.prisma.resource.create({ data: payload });
  }

  async createResources(payloads: Prisma.ResourceCreateInput[]) {
    return Promise.all(payloads.map((p) => this.createResource(p)));
  }

  async list() {
    return await this.prisma.resource.findMany();
  }

  async destroy() {
    await this.prisma.$disconnect();
  }
}
