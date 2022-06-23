import type { Plan } from '../types';

import { context } from '../context/';

import { daemonSearch } from '../anime';

import { info } from './utils';
import { bangumiLink } from '../utils';

export class Daemon {
  private plan!: Plan;

  async init() {
    info('Start initing daemon');

    this.plan = await context.getCurrentPlan();
    await this.refreshEpisode();

    info('Init daemon OK');
  }

  private async refreshEpisode() {
    for (const onair of this.plan.onair) {
      // Ensure string id
      if (typeof onair.bgmId === 'number') {
        onair.bgmId = String(onair.bgmId);
      }

      await daemonSearch(onair.bgmId);

      const anime = await context.getAnime(onair.bgmId);
      if (anime) {
        info();
        info('Onair: ' + anime.title + ' ' + `(${bangumiLink(onair.bgmId)})`);
      }

      if (!(await context.getAnime(onair.bgmId))) {
        throw new Error(
          `Fail to init ${onair.name} (${bangumiLink(onair.bgmId)})`
        );
      }
    }
  }

  async update() {
    info('Start updating anime');

    this.refreshEpisode();

    info('Update OK');
  }
}
