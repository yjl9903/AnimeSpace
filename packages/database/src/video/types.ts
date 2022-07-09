export interface VideoInfo<T extends string = string> {
  /**
   * Storage type, only supports Ali OSS
   *
   * @default 'ali'
   */
  platform: T;

  /**
   * Video ID
   */
  videoId: string;

  /**
   * Video title
   */
  title: string;

  /**
   * Creation time
   */
  createdAt: string;

  /**
   * Cover image
   */
  cover?: string;

  /**
   * Play urls
   */
  playUrl: string[];

  /**
   * Video source
   */
  source: VideoSource;
}

export interface VideoSource {
  magnetId?: string;

  directory?: string;

  hash?: string;
}
