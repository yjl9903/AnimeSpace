import type { GlobalContex } from '../../context';

export type CreateStore = (config: GlobalContex) => Promise<Store>;

export abstract class Store {
  protected abstract doUpload(payload: Payload): Promise<string | undefined>;

  abstract fetchVideoInfo(videoId: string): Promise<any>;

  async upload(payload: Payload): Promise<any> {
    const videoId = await this.doUpload(payload);
    if (videoId) {
      return await this.fetchVideoInfo(videoId);
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
