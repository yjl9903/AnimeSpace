import type { VideoInfo, LocalVideoInfo } from '../../types';

import path from 'node:path';

import { hashFile } from '../../utils';
import { context, GlobalContex } from '../../context';

export type CreateStore = (config: GlobalContex) => Promise<Store>;

export { VideoInfo, LocalVideoInfo };

export abstract class Store {
  private readonly type: string;
  private readonly logs: LocalVideoInfo[] = [];

  constructor(type: string) {
    this.type = type;
  }

  async init() {
    this.logs.splice(0);
    this.logs.push(...(await context.storeLog.list()));
  }

  protected abstract doUpload(payload: Payload): Promise<string | undefined>;

  protected abstract doDelete(videoId: string): Promise<boolean>;

  protected abstract doFetchVideoInfo(
    videoId: string
  ): Promise<VideoInfo | undefined>;

  async fetchVideoInfo(
    videoId: string
  ): Promise<LocalVideoInfo | VideoInfo | undefined> {
    const localVideo = this.logs.find((l) => l.videoId === videoId);
    if (localVideo) {
      return localVideo;
    } else {
      return this.doFetchVideoInfo(videoId);
    }
  }

  async searchLocalVideo(
    filename: string
  ): Promise<LocalVideoInfo | undefined> {
    const name = path.basename(filename);
    const videos = this.logs.filter(
      (l) => path.basename(l.filepath) === name && l.store === this.type
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
    if (videoIdx !== -1 && logs[videoIdx].store === this.type) {
      await this.doDelete(videoId);
      logs.splice(videoIdx, 1);
      await context.storeLog.write(logs);
    }
    await this.init();
  }

  async upload(payload: Payload): Promise<VideoInfo | undefined> {
    const hash = hashFile(payload.filepath);

    for (const log of this.logs) {
      if (
        log.filepath === payload.filepath &&
        log.hash === hash &&
        log.store === this.type
      ) {
        return log;
      }
    }

    const videoId = await this.doUpload(payload);
    if (videoId) {
      const info = await this.doFetchVideoInfo(videoId);
      if (!info) throw new Error('Fail to upload');
      const local: LocalVideoInfo = {
        ...info,
        filepath: payload.filepath,
        hash
      };
      await context.storeLog.append(local);
      await this.init();
      return local;
    } else {
      throw new Error('Fail to upload');
    }
  }
}

export interface Payload {
  /**
   * Video Title
   */
  title: string;

  /**
   * The path of video file to be uploaded
   */
  filepath: string;
}
