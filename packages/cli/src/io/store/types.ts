import type { VideoInfo, LocalVideoInfo } from '../../types';
import type { GlobalContex } from '../../context';

import path from 'node:path';

import { hashFile } from '../../utils';

export type CreateStore = (config: GlobalContex) => Promise<Store>;

export { VideoInfo, LocalVideoInfo };

export abstract class Store {
  private readonly context: GlobalContex;
  private readonly type: string;

  constructor(context: GlobalContex, type: string) {
    this.context = context;
    this.type = type;
  }

  protected abstract doUpload(payload: Payload): Promise<string | undefined>;

  protected abstract doDelete(videoId: string): Promise<boolean>;

  async deleteVideo(videoId: string) {
    const logs = await this.context.storeLog.list();
    const videoIdx = logs.findIndex((l) => l.videoId === videoId);
    if (videoIdx !== -1 && logs[videoIdx].store === this.type) {
      await this.doDelete(videoId);
      logs.splice(videoIdx, 1);
      await this.context.storeLog.write(logs);
    }
  }

  abstract fetchVideoInfo(videoId: string): Promise<VideoInfo | undefined>;

  async searchLocalVideo(filename: string) {
    const name = path.basename(filename);
    const videos = (await this.context.storeLog.list()).filter(
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

  async upload(payload: Payload): Promise<VideoInfo | undefined> {
    const hash = hashFile(payload.filepath);

    for (const log of await this.context.storeLog.list()) {
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
      const info = await this.fetchVideoInfo(videoId);
      if (!info) throw new Error('Fail to upload');
      const local: LocalVideoInfo = {
        ...info,
        filepath: payload.filepath,
        hash
      };
      await this.context.storeLog.append(local);
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
