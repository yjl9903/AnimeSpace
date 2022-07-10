import cnchar from 'cnchar';
import trad from 'cnchar-trad';
import createDebug from 'debug';
import { Prisma, Resource } from '@prisma/client';
import { subMonths, isBefore, subDays } from 'date-fns';

import { sleep } from '../utils';
import { AbstractDatabase, DatabaseOption } from '../database';

import { fetchResource } from './fetch';

cnchar.use(trad);

const debug = createDebug('anime:database');

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

export class MagnetStore extends AbstractDatabase {
  private _timestamp!: Date;

  constructor(option: DatabaseOption = {}) {
    super(option);
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

      listener && listener({ page, url, timestamp });

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
        // Avoid the oldest date in database not being exist
        indexOption.limit = subDays(indexOption.limit, 1);
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

  async findById(id: string) {
    return (
      (await this.prisma.resource.findUnique({
        where: {
          id
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

  idToLink(magnetId: string) {
    return `https://share.dmhy.org/topics/view/${magnetId}.html`;
  }
}
