import type { Item } from 'bangumi-data';

import type { SearchResultItem } from './resources';

import { getBgmTitle, getBgmId } from './utils';

export class Anime {
  readonly title: string = '';

  readonly bgmId: string = '';

  readonly episodes: Episode[] = [];

  constructor(option: { title: string; bgmId: string; episodes?: Episode[] }) {
    this.title = option.title;
    this.bgmId = option.bgmId;
    if (option.episodes) {
      this.episodes = option.episodes;
    }
  }

  static bangumi(item: Item) {
    return new Anime({ title: getBgmTitle(item), bgmId: getBgmId(item)! });
  }

  static copy(anime: Anime) {
    return new Anime({
      title: anime.title,
      bgmId: anime.bgmId,
      episodes: anime.episodes
    });
  }

  addSearchResult(results: SearchResultItem[]) {
    const foundIds = new Set(this.episodes.map((ep) => ep.magnetId));

    for (const result of results) {
      if (foundIds.has(result.id)) continue;

      if (result.name.indexOf('MKV') !== -1) continue;

      const getEp = () => {
        for (const RE of [
          /\[(\d+)([vV]\d+)\]/,
          /【(\d+)([vV]\d+)】/,
          /- (\d+) /,
          /第(\d+)話/,
          /第(\d+)话/,
          /第(\d+)集/
        ]) {
          const match = RE.exec(result.name);
          if (match) {
            return +match[1];
          }
        }
        return 0;
      };

      const getQulity = (): 1080 | 720 => {
        if (
          result.name.indexOf('720P') !== -1 ||
          result.name.indexOf('720p') !== -1 ||
          result.name.indexOf('1280X720') !== -1 ||
          result.name.indexOf('1280x720') !== -1
        ) {
          return 720;
        } else {
          return 1080;
        }
      };

      const getLang = () => {
        if (result.name.indexOf('简') !== -1) {
          return 'zh-Hans';
        } else if (result.name.indexOf('繁') !== -1) {
          return 'zh-Hant';
        } else {
          return 'zh-Hans';
        }
      };

      const ep: Episode = {
        ep: getEp(),
        quality: getQulity(),
        language: getLang(),
        creationTime: result.creationTime,
        fansub: result.fansub,
        magnetId: result.id,
        magnetName: result.name,
        bgmId: this.bgmId
      };

      if (ep.ep > 0) {
        this.episodes.push(ep);
      }
    }
  }
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
   * airdate
   */
  creationTime: string;

  /**
   * Link to magnet
   */
  magnetId: string;
  magnetName: string;

  /**
   * Link to the parent Anime
   */
  bgmId: string;
}
