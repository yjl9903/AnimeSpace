import type { GlobalContex } from '../../context';

export type CreateStore = (config: GlobalContex) => Promise<Store>;

export abstract class Store {
  abstract upload(payload: Payload): Promise<boolean>;

  abstract fetchVideoInfo(): Promise<any>;
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
