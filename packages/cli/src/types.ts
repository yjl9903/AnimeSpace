export type AnimeType = 'tv' | 'web' | 'movie' | 'ova';

export interface CliOption {
  force: boolean;
}

export interface ResolvedOption {}

export interface Plan {
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
   */
  state: 'onair' | 'finish';

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
   * Bangumi ID
   */
  bgmId: string;

  /**
   * Fansub order
   */
  fansub?: string[];

  /**
   * Specify online link
   */
  link?: string;

  /**
   * Specify the play url of some eps
   */
  ep?: Record<number, string>;

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
