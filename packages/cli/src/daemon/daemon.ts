import { dim, link } from 'kolorist';

import type { Plan } from '../types';

import { context } from '../context/';

import { TorrentClient, useStore } from '../io';
import { bangumiLink } from '../utils';
import { daemonSearch, formatMagnetURL } from '../anime';

import { info } from './utils';

export class Daemon {
  private plan!: Plan;
  private magnetCache!: Map<string, string>;

  async init() {
    info('Start initing daemon');

    this.plan = await context.getCurrentPlan();

    await this.refreshEpisode();
    await this.downloadEpisode();

    info('Init daemon OK');
  }

  async update() {
    info('Start updating anime');

    await this.refreshEpisode();
    await this.downloadEpisode();

    info('Update OK');
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
        info(
          'Refresh : ' + anime.title + ' ' + `(${bangumiLink(onair.bgmId)})`
        );
      }

      if (!(await context.getAnime(onair.bgmId))) {
        throw new Error(
          `Fail to init ${onair.name} (${bangumiLink(onair.bgmId)})`
        );
      }
    }

    this.magnetCache = new Map(
      (await context.magnetLog.list()).map((mg) => [mg.id, mg.magnet])
    );
  }

  private async downloadEpisode() {
    for (const onair of this.plan.onair) {
      const anime = await context.getAnime(onair.bgmId);
      if (!anime) {
        throw new Error(
          `Fail to get ${onair.name} (${bangumiLink(onair.bgmId)})`
        );
      }

      const episodes = anime.genEpisodes(onair.fansub);

      info('Download: ' + anime.title + ' ' + `(${bangumiLink(onair.bgmId)})`);
      for (const ep of episodes) {
        info(
          ` ${ep.ep < 10 ? ' ' : ''}${dim(ep.ep)} ${link(
            ep.magnetName,
            formatMagnetURL(ep.magnetId)
          )}`
        );
      }

      const magnets = episodes.map((ep) => this.magnetCache.get(ep.magnetId)!);
      const localRoot = await context.makeLocalAnimeRoot(anime.title);
      const torrent = new TorrentClient(localRoot);
      await torrent.download(magnets);
      await torrent.destroy();

      const createStore = useStore('ali');
      const store = await createStore(context);
    }
  }
}
