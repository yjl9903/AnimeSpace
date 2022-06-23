export type AnimeType = 'tv' | 'web' | 'movie' | 'ova';

export interface CliOption {
  force: boolean;
}

export interface ResolvedOption {}

export interface VideoInfo {
  store: 'ali';

  videoId: string;

  title: string;

  creationTime: string;

  cover: string;

  playUrl: string[];
}

export interface LocalVideoInfo extends VideoInfo {
  filepath: string;

  hash: string;
}

export interface Plan {
  /**
   * Plan name
   */
  name: string;

  /**
   * Plan time
   */
  time: string;

  onair: OnairPlan[];
}

export interface OnairPlan {
  /**
   * Anime name
   */
  name: string;

  /**
   * Bangumi ID
   */
  bgmId: string;

  /**
   * Fansub order
   */
  fansub: string[];
}
