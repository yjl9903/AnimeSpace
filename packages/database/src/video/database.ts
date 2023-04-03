import type { Video } from '@prisma/client';
import { AbstractDatabase, DatabaseOption } from '../database';

import type { VideoInfo } from './types';

export class VideoStore<T extends string = string> extends AbstractDatabase {
  constructor(option: DatabaseOption) {
    super(option);
  }

  async createVideo(payload: VideoInfo<T>) {
    return await this.prisma.video.create({
      data: {
        id: payload.videoId,
        platform: payload.platform,
        title: payload.title,
        createdAt: payload.createdAt,
        cover: payload.cover,
        playUrls: JSON.stringify(payload.playUrl),
        magnetId: payload.source.magnetId,
        directory: payload.source.directory,
        hash: payload.source.hash
      }
    });
  }

  async updateVideo(payload: VideoInfo<T>) {
    return await this.prisma.video.update({
      where: {
        id_platform: {
          id: payload.videoId,
          platform: payload.platform
        }
      },
      data: {
        id: payload.videoId,
        platform: payload.platform,
        title: payload.title,
        createdAt: payload.createdAt,
        cover: payload.cover,
        playUrls: JSON.stringify(payload.playUrl),
        magnetId: payload.source.magnetId,
        directory: payload.source.directory,
        hash: payload.source.hash
      }
    });
  }

  async findVideo(
    platform: string,
    id: string
  ): Promise<VideoInfo<T> | undefined> {
    const resp = await this.prisma.video.findUnique({
      where: {
        id_platform: {
          id,
          platform
        }
      }
    });
    if (resp) {
      return this.toVideoInfo(resp);
    } else {
      return undefined;
    }
  }

  async deleteVideo(platform: string, id: string) {
    await this.prisma.video.delete({
      where: {
        id_platform: {
          id,
          platform
        }
      }
    });
  }

  async list() {
    const data = await this.prisma.video.findMany();
    return data.map(this.toVideoInfo);
  }

  private toVideoInfo(resp: Video): VideoInfo<T> {
    return {
      videoId: resp.id,
      platform: resp.platform as T,
      title: resp.title,
      createdAt: resp.createdAt.toISOString(),
      cover: resp.cover ?? undefined,
      playUrl: JSON.parse(resp.playUrls),
      source: {
        magnetId: resp.magnetId ?? undefined,
        directory: resp.directory ?? undefined,
        hash: resp.hash ?? undefined
      }
    };
  }
}
