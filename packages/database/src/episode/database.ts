import type { Episode as RawEpisode, Resource } from '@prisma/client';

import createDebug from 'debug';

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

  async createEpisode(bgmId: string, payload: Resource) {
    const parsed = this.parser.parse(payload.title);
    debug(payload.title + ' => ' + JSON.stringify(parsed, null, 2));

    return this.toEpisode(
      await this.prisma.episode.create({
        data: {
          magnetId: payload.id,
          bgmId: +bgmId,
          ep: parsed.ep,
          fansub: payload.fansub,
          attrs: JSON.stringify(parsed.tags ?? [])
        },
        include: {
          magnet: true
        }
      })
    );
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
        bgmId: {
          equals: +bgmId
        }
      },
      include: {
        magnet: true
      }
    });
    return eps.map((ep) => this.toEpisode(ep));
  }
}
