import type { BaseBangumi, ExtendBangumi } from '@animepaste/bangumi';

import type { VideoStorePlatform } from './io';

export type CustomBangumi = BaseBangumi &
  Pick<ExtendBangumi, 'titleCN' | 'titleTranslate' | 'begin' | 'dmhy'>;

export type AnimeType = 'tv' | 'web' | 'movie' | 'ova';

export interface CliOption {
  force: boolean;
}

export interface ResolvedOption {}

export interface RawPlan {
  /**
   * Plan name
   */
  name: string;

  /**
   * Plan date
   */
  date: Date;

  /**
   * Plan is onair or finish
   *
   * @default 'onair'
   */
  state: 'onair' | 'finish';

  /**
   * Store platform
   *
   * @default 'ali'
   */
  store: VideoStorePlatform;

  /**
   * Template string for names
   *
   * @default '[{fansub}] {title} - S{season}E{ep}.mp4'
   */
  format?: string;

  /**
   * Onair list
   */
  onair: OnairPlan[];
}

export interface OnairPlan {
  /**
   * Anime name
   */
  title: string;

  /**
   * Anime season
   *
   * This value may be inferred from the title or be set with the default value 1
   */
  season: number;

  /**
   * Bangumi ID
   */
  bgmId: string;

  /**
   * Plan is onair or finish
   *
   * @default 'onair'
   */
  state: 'onair' | 'finish';

  /**
   * Fansub order
   */
  fansub?: string[];

  /**
   * Specify play link
   *
   * Type string for other platform
   *
   * Type record for play urls
   */
  link?: string | EpisodesInputList;

  /**
   * Specify the magnet id of some episode
   */
  magnet?: EpisodesInputList;

  /**
   * Specify OSS source of some episode
   */
  source?: EpisodesInputList;

  /**
   * Template string for names
   *
   * @default '[{fansub}] {title} - S{season}E{ep}.mp4'
   */
  format: string;

  /**
   * Keywords for searching resources
   */
  keywords?: string[];
}

export type EpisodesInputList = Record<number, string> | string[];
