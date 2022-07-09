import path from 'node:path';

import type { VideoInfo } from '../types';

import { hashFile } from '../../utils';
import { context } from '../../context';

export type CreateStore = () => Promise<Store>;

export abstract class Store {
  private readonly platform: string;
  private readonly logs: VideoInfo[] = [];

  constructor(platform: string) {
    this.platform = platform;
  }

  async init() {
    this.logs.splice(0);
    this.logs.push(...(await context.storeLog.list()));
  }

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
    const localVideo = this.logs.find((l) => l.videoId === videoId);
    if (localVideo) {
      return localVideo;
    } else {
      return this.doFetchVideoInfo(videoId);
    }
  }

  async searchLocalVideo(filename: string): Promise<VideoInfo | undefined> {
    const title = path.basename(filename);
    const videos = this.logs.filter(
      (l) => path.basename(l.title) === title && l.platform === this.platform
    );
    if (videos.length === 0) {
      return undefined;
    } else {
      if (videos.length > 1) {
        // Duplicate name
      }
      return videos[0];
    }
  }

  async listLocalVideos() {
    return this.logs;
  }

  async deleteVideo(videoId: string) {
    const logs = this.logs;
    const videoIdx = logs.findIndex((l) => l.videoId === videoId);
    if (videoIdx !== -1 && logs[videoIdx].platform === this.platform) {
      await this.doDelete(videoId);
      logs.splice(videoIdx, 1);
      await context.storeLog.write(logs);
    }
    await this.init();
  }

  async upload(
    filepath: string,
    option: StoreOption = {}
  ): Promise<VideoInfo | undefined> {
    const title = path.basename(filepath);
    const hash = await hashFile(filepath);

    for (const log of this.logs) {
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
      info.source.directory = path.dirname(filepath);
      info.source.hash = hash;
      await context.storeLog.append(info);
      await this.init();
      return info;
    } else {
      throw new Error('Fail to upload');
    }
  }
}

export interface StoreOption {
  retry?: number;
}
