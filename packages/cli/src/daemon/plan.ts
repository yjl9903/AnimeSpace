import { link } from 'kolorist';

import type { RawPlan } from '../types';

import { context } from '../context';
import { bangumiLink } from '../anime';
import { DOT, logger, padRight, titleColor } from '../logger';

export class Plan {
  private readonly baseURL: string;
  private readonly plans: RawPlan[];

  constructor(option: { baseURL: string; plans: RawPlan[] }) {
    this.baseURL = option.baseURL;
    this.plans = option.plans;
  }

  static async create() {
    const plans = await context.getPlans();
    return new Plan({
      baseURL: (await context.getServerConfig()).baseURL,
      plans
    });
  }

  printOnair() {
    const titles: string[] = [];
    const bgms: string[] = [];
    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        titles.push(onair.title);
        bgms.push(onair.bgmId);
      }
    }
    const padded = padRight(titles);
    for (let i = 0; i < padded.length; i++) {
      const onlineLink = !!this.baseURL
        ? context.formatOnlineURL(this.baseURL, bgms[i])
        : '';
      const title = !!onlineLink
        ? link(titleColor(padded[i]), onlineLink)
        : titleColor(padded[i]);
      const bgmLink = `(${bangumiLink(bgms[i])})`;

      if (context.isDaemon) {
        logger.info(`Onair ${title} ${bgmLink}`);
      } else {
        logger.println(`${DOT} ${title} ${bgmLink}`);
      }
    }
  }
}
