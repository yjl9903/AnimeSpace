import type { Resource } from '@prisma/client';

export interface EpisodePayload {
  magnetId: string;
  bgmId: string;
  ep?: number;
  fansub?: string;
  quality?: number;
  language?: string;
  attrs?: string[];
}

export interface Episode {
  /**
   * 条目内的集数, 从 1 开始
   */
  ep: number;

  /**
   * fansub
   */
  fansub: string;

  /**
   * Video qulity
   */
  quality: 1080 | 720;

  /**
   * 简体和繁体
   */
  language: 'zh-Hans' | 'zh-Hant';

  /**
   * Link to the parent Anime
   */
  bgmId: string;

  /**
   * Magnet resource
   */
  magnet: Resource;
}
