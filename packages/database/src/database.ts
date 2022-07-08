import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import createDebug from 'debug';
import cnchar from 'cnchar';
import trad from 'cnchar-trad';
import { subMonths, isBefore } from 'date-fns';
import { PrismaClient, Prisma, Resource } from '@prisma/client';

import { sleep } from './utils';
import { fetchResource } from './fetch';

cnchar.use(trad);

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
  limit?: Date | undefined;

  /**
   * Fetch page start
   *
   * @default '1'
   */
  startPage?: number | undefined;

  /**
   * Fetch page limit
   *
   * @default 'undefined'
   */
  endPage?: number | undefined;

  /**
   * Break when page found
   *
   * @default 'true'
   */
  earlyStop?: boolean | undefined;

  /**
   * Handle progress event
   */
  listener?: (state: {
    page: number;
    url: string;
    timestamp?: Date;
    ok?: number;
  }) => void;
}

export class Database {
  private static DefaultFilepath = path.join(
    fileURLToPath(import.meta.url),
    '../../prisma/anime.db'
  );

  private readonly filepath: string;
  private readonly prisma = new PrismaClient();

  private _timestamp!: Date;

  constructor(option: DatabaseOption = {}) {
    if (option.url) {
      this.filepath = option.url;
      this.prisma = new PrismaClient({
        datasources: { db: { url: 'file:' + option.url } }
      });
    } else {
      this.filepath = Database.DefaultFilepath;
    }
  }

  async init() {
    if (!fs.existsSync(this.filepath)) {
      await fs.promises.copyFile(Database.DefaultFilepath, this.filepath);
    }
  }

  async index({
    limit = subMonths(new Date(), 6),
    startPage,
    endPage,
    earlyStop = true,
    listener
  }: IndexOption = {}) {
    debug(`Index to date: ${limit}`);
    debug(`Index page from ${startPage} to ${endPage}`);
    debug(`Early Stop ${earlyStop ? 'enabled' : 'disabled'}`);

    let timestamp: Date | undefined = undefined;

    for (let page = startPage ?? 1; !endPage || page <= endPage; page++) {
      const url = `https://share.dmhy.org/topics/list/page/${page}`;

      listener && listener({ page, url });

      const payloads = await fetchResource(page);

      let stop = false;
      let inserted = 0;

      for (const p of payloads) {
        const createdAt = new Date(p.createdAt);
        timestamp = createdAt;
        if (isBefore(createdAt, limit)) {
          stop = true;
          break;
        }
        const ok = await this.createResource(p);
        if (ok) {
          inserted++;
        }
      }

      listener && listener({ page, url, timestamp, ok: inserted });

      if (stop || (earlyStop && !inserted)) {
        break;
      }
      await sleep();
    }
  }

  async search(keyword: string | string[], indexOption: IndexOption = {}) {
    if (indexOption.limit) {
      const oldest = await this.timestamp();
      if (isBefore(indexOption.limit, oldest)) {
        indexOption.earlyStop = false;
        await this.index(indexOption);
      }
    }

    const keywords = typeof keyword === 'string' ? [keyword] : keyword;
    debug(keywords.map((k) => cnchar.convert.simpleToTrad(k)).join('\n'));
    const result = await this.prisma.resource.findMany({
      where: {
        OR: [
          ...keywords,
          ...keywords.map((k) => cnchar.convert.simpleToTrad(k))
        ].map((w) => ({ title: { contains: w } })),
        type: '動畫',
        createdAt: {
          gt: indexOption.limit
        }
      }
    });
    return result;
  }

  async createResource(payload: Prisma.ResourceCreateInput) {
    try {
      const resp = await this.prisma.resource.create({ data: payload });
      await this.timestamp(new Date(payload.createdAt));
      return resp;
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

  async findByLink(link: string) {
    return (
      (await this.prisma.resource.findUnique({
        where: {
          link
        }
      })) ?? undefined
    );
  }

  async createResources(
    payloads: Prisma.ResourceCreateInput[]
  ): Promise<Resource[]> {
    return (
      await Promise.all(payloads.map((p) => this.createResource(p)))
    ).filter(Boolean) as Resource[];
  }

  async timestamp(newValue?: Date) {
    if (!this._timestamp) {
      const t = await this.prisma.resource.aggregate({
        _min: {
          createdAt: true
        }
      });
      this._timestamp = t._min.createdAt ?? new Date();
      debug('Init oldest timestamp: ' + this._timestamp.toLocaleDateString());
    }
    if (newValue) {
      return isBefore(newValue, this._timestamp)
        ? (this._timestamp = newValue)
        : this._timestamp;
    } else {
      return this._timestamp;
    }
  }

  async list() {
    return await this.prisma.resource.findMany();
  }

  async destroy() {
    await this.prisma.$disconnect();
  }

  formatMagnetLink(magnetLink: string) {
    return `https://share.dmhy.org/topics/view/${magnetLink}.html`;
  }
}
