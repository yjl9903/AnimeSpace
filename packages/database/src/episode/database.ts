import type { Episode as RawEpisode, Resource } from '@prisma/client';

import { AbstractDatabase } from '../database';

import type { EpisodePayload, Episode } from './types';

export type { Episode };

export class EpisodeStore extends AbstractDatabase {
  private static toEpisode(raw: RawEpisode & { magnet: Resource }): Episode {
    const attrs: string[] = JSON.parse(raw.attrs);
    return {
      bgmId: String(raw.bgmId),
      magnet: raw.magnet,
      ep: raw.ep,
      fansub: raw.fansub,
      quality: attrs.includes('720') ? 720 : 1080,
      language: attrs.includes('zh-Hant') ? 'zh-Hant' : 'zh-Hans'
    };
  }

  async createEpisode(payload: EpisodePayload) {
    const attrs = payload.attrs ?? [];
    if (payload.quality) {
      attrs.push(String(payload.quality));
    }
    if (payload.language) {
      attrs.push(String(payload.language));
    }

    return await this.prisma.episode.create({
      data: {
        magnetId: payload.magnetId,
        bgmId: +payload.bgmId,
        ep: payload.ep,
        fansub: payload.fansub,
        attrs: JSON.stringify(attrs)
      }
    });
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
      return EpisodeStore.toEpisode(raw);
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
    return eps.map((ep) => EpisodeStore.toEpisode(ep));
  }
}
