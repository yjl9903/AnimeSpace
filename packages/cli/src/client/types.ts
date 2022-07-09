export interface OnairAnime {
  title: string;

  bgmId: string;

  episodes: (OnairEpisode | OnlineEpisode)[];

  link?: string;
}

export interface OnlineEpisode {
  /**
   * 条目内的集数, 从 1 开始
   */
  ep: number;

  /**
   * Play url
   */
  playURL: string;
}

export interface OnairEpisode {
  /**
   * 条目内的集数, 从 1 开始
   */
  ep: number;

  /**
   * Video qulity
   */
  quality: 1080 | 720;

  /**
   * Airdate
   */
  creationTime: string;

  /**
   * Play url
   */
  playURL: string;

  /**
   * Global storage config
   */
  storage: {
    type: string;
    videoId: string;
  };
}

export interface UserOption {
  token: string;

  baseURL: string;

  onairIds?: Set<string>;
}
