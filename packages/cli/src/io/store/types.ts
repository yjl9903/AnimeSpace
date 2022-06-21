import type { VideoInfo, LocalVideoInfo } from '../../types';
import type { GlobalContex } from '../../context';

import { hashFile } from '../../utils';

export type CreateStore = (config: GlobalContex) => Promise<Store>;

export { VideoInfo, LocalVideoInfo };

export abstract class Store {
  private readonly context: GlobalContex;

  constructor(context: GlobalContex) {
    this.context = context;
  }

  protected abstract doUpload(payload: Payload): Promise<string | undefined>;

  abstract fetchVideoInfo(videoId: string): Promise<VideoInfo | undefined>;

  async upload(payload: Payload): Promise<VideoInfo | undefined> {
    const hash = hashFile(payload.filepath);

    for (const log of await this.context.uploadLog.list()) {
      if (log.filepath === payload.filepath && log.hash === hash) {
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
      await this.context.uploadLog.append(local);
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
