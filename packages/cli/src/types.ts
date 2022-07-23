import { VideoStorePlatform } from './io';

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
   * Onair list
   */
  onair: OnairPlan[];
}

export type EpisodeList = Record<number, string> | string[];

export interface OnairPlan {
  /**
   * Anime name
   */
  title: string;

  /**
   * Bangumi ID
   */
  bgmId: string;

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
  link?: string | EpisodeList;

  /**
   * Specify the magnet id of some episode
   */
  magnet?: EpisodeList;

  /**
   * Specify OSS source of some episode
   */
  source?: EpisodeList;

  /**
   * Template string for names
   *
   * @default '[{fansub}] {title} - {ep}.mp4'
   */
  format?: string;

  /**
   * Keywords for searching resources
   */
  keywords?: string[];
}
