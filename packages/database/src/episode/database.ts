import type { Episode as RawEpisode, Resource } from '@prisma/client';

import createDebug from 'debug';
import * as Prisma from '@prisma/client';

import { MagnetParser } from '../parser';
import { AbstractDatabase } from '../database';

import type { Episode } from './types';

export type { Episode };

const debug = createDebug('anime:database');

export class EpisodeStore extends AbstractDatabase {
  readonly parser: MagnetParser = new MagnetParser();

  private toEpisode(raw: RawEpisode & { magnet: Resource }): Episode {
    const attrs: string[] = JSON.parse(raw.attrs);
    return {
      bgmId: String(raw.bgmId),
      magnet: raw.magnet,
      ep: raw.ep,
      fansub: raw.fansub,
      quality: this.parser.quality({ tags: attrs }),
      language: this.parser.language({ tags: attrs })
    };
  }

  async createEpisode(
    bgmId: string,
    magnet: Resource
  ): Promise<Episode | undefined> {
    const parsed = this.parser.parse(magnet.title);
    debug(magnet.title + ' => ' + JSON.stringify(parsed, null, 2));

    try {
      return this.toEpisode(
        await this.prisma.episode.create({
          data: {
            magnetId: magnet.id,
            bgmId: +bgmId,
            ep: parsed.ep,
            fansub: magnet.fansub,
            attrs: JSON.stringify(parsed.tags ?? [])
          },
          include: {
            magnet: true
          }
        })
      );
    } catch (error) {
      if (error instanceof Prisma.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          debug(`Found episode: ${magnet.title}`);
        } else {
          debug(error);
        }
      } else {
        debug(error);
      }
    }
  }

  async findEpisode(magnetId: string): Promise<Episode | undefined> {
    const raw = await this.prisma.episode.findUnique({
      where: {
        magnetId
      },
      include: {
        magnet: true
      }
    });
    if (raw) {
      return this.toEpisode(raw);
    } else {
      return undefined;
    }
  }

  async listEpisodes(bgmId: string): Promise<Episode[]> {
    const eps = await this.prisma.episode.findMany({
      where: {
        bgmId: +bgmId
      },
      include: {
        magnet: true
      }
    });
    return eps.map((ep) => this.toEpisode(ep));
  }
}
