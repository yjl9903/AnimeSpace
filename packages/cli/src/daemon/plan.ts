import { link } from 'kolorist';
import { subMonths } from 'date-fns';

import type { Episode } from '@animepaste/database';

import type { RawPlan } from '../types';

import { context } from '../context';
import { groupBy } from '../utils';
import { bangumiLink } from '../anime';
import { DOT, logger, padRight, titleColor } from '../logger';

import { LOCALE } from './constant';

export class Plan {
  private readonly baseURL: string;
  private readonly plans: RawPlan[];

  constructor(option: { baseURL: string; plans: RawPlan[] }) {
    this.baseURL = option.baseURL;
    this.plans = option.plans;
  }

  static async create() {
    const plans = await context.getPlans();
    for (const plan of plans) {
      // Setup date (default: 6 months ago)
      if (!Boolean(plan.date)) {
        plan.date = subMonths(new Date(), 6);
      } else {
        plan.date = new Date(plan.date);
      }

      // Setup state (default: onair)
      if (!Boolean(plan.state)) {
        plan.state = 'onair';
      }

      // Setup store platform (default: ali)
      if (!Boolean(plan.store)) {
        plan.store = 'ali';
      }

      // Fix onairs
      for (const bgm of plan.onair) {
        // Fix bgmId string type
        if (typeof bgm.bgmId === 'number') {
          bgm.bgmId = String(bgm.bgmId);
        }

        // Fix season
        if (
          !('season' in bgm) ||
          bgm.season === undefined ||
          bgm.season === null
        ) {
          bgm.season = inferSeason(bgm.title);
        } else {
          bgm.season = Number(bgm.season);
        }

        // Fix empty fansub
        if (
          !('fansub' in bgm) ||
          bgm.fansub === undefined ||
          bgm.fansub === null
        ) {
          bgm.fansub = [];
        }
      }
    }

    return new Plan({
      baseURL: (await context.getServerConfig()).baseURL,
      plans
    });
  }

  [Symbol.iterator]() {
    return this.plans.values();
  }

  onairs() {
    return [...this.plans].flatMap((p) => p.onair);
  }

  printOnair() {
    const titles: string[] = [];
    const bgms: string[] = [];
    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        const onlineLink = !!this.baseURL
          ? context.formatOnlineURL(this.baseURL, onair.bgmId)
          : '';
        const title =
          onair.title + (onair.season > 1 ? ` Season ${onair.season}` : '');
        titles.push(
          !!onlineLink ? link(titleColor(title), onlineLink) : titleColor(title)
        );
        bgms.push(onair.bgmId);
      }
    }
    const padded = padRight(titles);
    for (let i = 0; i < padded.length; i++) {
      const bgmLink = `(${bangumiLink(bgms[i])})`;
      if (context.isDaemon) {
        logger.info(`Onair ${padded[i]} ${bgmLink}`);
      } else {
        logger.println(`${DOT} ${padded[i]} ${bgmLink}`);
      }
    }
  }

  genEpisodes(allEpisodes: Episode[], fansubOrder: string[]) {
    const fansubs = groupBy(allEpisodes, (ep) => ep.fansub);
    const episodes: Episode[] = [];
    for (let epId = 1, found = true; found; epId++) {
      found = false;
      for (const fs of fansubOrder) {
        const eps = fansubs.getOrDefault(fs, []).filter((ep) => ep.ep === epId);
        if (eps.length === 1) {
          found = true;
          episodes.push(eps[0]);
        } else if (eps.length > 1) {
          eps.sort((a, b) => {
            if (a.quality !== b.quality) {
              return b.quality - a.quality;
            }
            const gL = (a: Episode) => (a.language === LOCALE ? 1 : 0);
            const dL = gL(b) - gL(a);
            if (dL !== 0) return dL;
            return (
              new Date(b.magnet.createdAt).getTime() -
              new Date(a.magnet.createdAt).getTime()
            );
          });
          found = true;
          episodes.push(eps[0]);
        }
        if (found) break;
      }
    }
    return episodes;
  }
}

function inferSeason(title: string) {
  const PATTERN: [number, string][] = [
    [2, '2nd Season'],
    [3, '3rd Season'],
    [4, '4th Season']
  ];
  for (const pat of PATTERN) {
    if (title.indexOf(pat[1]) !== -1) {
      return pat[0];
    }
  }

  const RE = /第(\d+|[零一二三四五六七八九十]+)季/;
  const match = RE.exec(title);
  if (match) {
    const num = Number(match[1]);
    if (Number.isNaN(num)) {
      const LIST = '零一二三四五六七八九十'.split('');
      for (const [i, c] of Object.entries(LIST)) {
        if (match[1] === c) {
          return +i;
        }
      }
      return 1;
    } else {
      return num;
    }
  } else {
    return 1;
  }
}
