import path from 'node:path';

import type { VideoInfo } from '../types';

import { context } from '../../context';

import { hashFile } from '../utils';

export type CreateStore = () => Promise<Store>;

export abstract class Store {
  private readonly platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  async init() {}

  protected abstract doFetchVideoInfo(
    videoId: string,
    option?: StoreOption
  ): Promise<VideoInfo | undefined>;

  protected abstract doUpload(
    filePath: string,
    option?: StoreOption
  ): Promise<string | undefined>;

  protected abstract doDelete(videoId: string): Promise<boolean>;

  async fetchVideoInfo(videoId: string): Promise<VideoInfo | undefined> {
    const localVideo = await context.videoStore.findVideo(
      this.platform,
      videoId
    );
    if (localVideo) {
      return localVideo;
    } else {
      return this.doFetchVideoInfo(videoId);
    }
  }

  async searchLocalVideo(filename: string): Promise<VideoInfo[]> {
    const title = path.basename(filename);
    return (await context.videoStore.list()).filter(
      (l) => l.title === title && l.platform === this.platform
    );
  }

  async listLocalVideos() {
    return await context.videoStore.list();
  }

  async deleteVideo(videoId: string) {
    const localVideo = await context.videoStore.findVideo(
      this.platform,
      videoId
    );
    if (localVideo) {
      await this.doDelete(videoId);
      await context.videoStore.deleteVideo(this.platform, videoId);
    }
  }

  async upload(
    filepath: string,
    option: StoreOption = {}
  ): Promise<VideoInfo | undefined> {
    filepath = await context.copyToCache(filepath);

    const title = path.basename(filepath);
    const hash = await hashFile(filepath);

    for (const log of await context.videoStore.list()) {
      if (
        log.platform === this.platform &&
        log.title === title &&
        (!log.source.hash || log.source.hash === hash)
      ) {
        return log;
      }
    }

    const videoId = await this.doUpload(filepath, option);
    if (videoId) {
      const info = await this.doFetchVideoInfo(videoId, option);
      if (!info) throw new Error('Fail to upload');
      info.source.magnetId = option.magnetId;
      info.source.directory = context.encodePath(path.dirname(filepath));
      info.source.hash = hash;
      await context.videoStore.createVideo(info);
      return info;
    } else {
      throw new Error('Fail to upload');
    }
  }
}

export interface StoreOption {
  /**
   * MagnetId
   */
  magnetId?: string;

  /**
   * Max retry number
   */
  retry?: number;
}
