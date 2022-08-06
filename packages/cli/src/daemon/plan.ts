import type { RawPlan } from '../types';

import { context } from '../context';
import { bangumiLink } from '../anime';
import { logger, titleColor } from '../logger';

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
    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        logger.info(
          'Onair    ' +
            titleColor(onair.title) +
            '    ' +
            `(${bangumiLink(onair.bgmId)})`
        );
      }
    }
  }
}
