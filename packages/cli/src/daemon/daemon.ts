import fs from 'fs-extra';
import { dim, link } from 'kolorist';

import type { Plan } from '../types';

import { context } from '../context/';

import { TorrentClient, useStore } from '../io';
import { bangumiLink, groupBy } from '../utils';
import { daemonSearch, Episode, formatMagnetURL } from '../anime';

import { info } from './utils';

const LOCALE = 'zh-Hans';

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
      const fansubs = groupBy(anime.episodes, (ep) => ep.fansub);
      const episodes: Episode[] = [];
      for (let epId = 1, found = true; found; epId++) {
        found = false;
        for (const fs of onair.fansub) {
          const eps = fansubs
            .getOrDefault(fs, [])
            .filter((ep) => ep.ep === epId);
          if (eps.length === 1) {
            found = true;
            episodes.push(eps[0]);
          } else if (eps.length > 1) {
            eps.sort((a, b) => {
              if (a.quality !== b.quality) {
                return b.quality - a.quality;
              }
              const gL = (a: Episode) => (a.language === LOCALE ? 1 : 0);
              return gL(b) - gL(a);
            });
            found = true;
            episodes.push(eps[0]);
          }
        }
      }

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
