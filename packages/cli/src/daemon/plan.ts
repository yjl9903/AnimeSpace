import { lightBlue } from 'kolorist';

import type { RawPlan } from '../types';

import { context } from '../context';
import { bangumiLink } from '../anime';
import { DOT, logger, padRight, titleColor } from '../logger';

export class Plan {
  private readonly plans: RawPlan[];

  constructor(plans: RawPlan[]) {
    this.plans = plans;
  }

  static async create() {
    const plans = await context.getPlans();
    return new Plan(plans);
  }

  printOnair() {
    const titles: string[] = [];
    const bgms: string[] = [];
    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        titles.push(titleColor(onair.title));
        bgms.push(`(${bangumiLink(onair.bgmId)})`);
      }
    }
    const padded = padRight(titles);
    for (let i = 0; i < padded.length; i++) {
      if (context.isDaemon) {
        logger.info(`Onair ${padded[i]} ${bgms[i]}`);
      } else {
        logger.println(`${DOT} ${lightBlue('Onair')} ${padded[i]} ${bgms[i]}`);
      }
    }
  }
}
