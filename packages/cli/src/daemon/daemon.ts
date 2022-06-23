import path from 'node:path';
import { dim, link, lightGreen } from 'kolorist';

import type { Plan } from '../types';

import { context } from '../context/';
import { bangumiLink } from '../utils';
import { TorrentClient, useStore } from '../io';
import { Anime, Episode, daemonSearch, formatMagnetURL } from '../anime';

import { info } from './utils';

export class Daemon {
  private plan!: Plan;
  private magnetCache!: Map<string, string>;

  async init() {
    info('Start initing daemon');

    this.plan = await context.getCurrentPlan();

    for (const onair of this.plan.onair) {
      info(
        'Onair    ' +
          lightGreen(onair.name) +
          ' ' +
          `(${bangumiLink(onair.bgmId)})`
      );
    }
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
          'Refresh  ' +
            lightGreen(anime.title) +
            ' ' +
            `(${bangumiLink(onair.bgmId)})`
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

      info(
        'Download ' +
          lightGreen(anime.title) +
          ' ' +
          `(${bangumiLink(onair.bgmId)})`
      );
      for (const ep of episodes) {
        info(
          ` ${ep.ep < 10 ? ' ' : ''}${dim(ep.ep)} ${link(
            ep.magnetName,
            formatMagnetURL(ep.magnetId)
          )}`
        );
      }

      const magnets = episodes.map((ep) => {
        return {
          magnetURI: this.magnetCache.get(ep.magnetId)!,
          filename: formatEpisodeName(onair.format, anime, ep)
        };
      });
      const localRoot = await context.makeLocalAnimeRoot(anime.title);
      const torrent = new TorrentClient(localRoot);
      await torrent.download(magnets);
      await torrent.destroy();
      info(
        'Download ' +
          lightGreen(anime.title) +
          ' OK ' +
          `(Total: ${magnets.length} episodes)`
      );

      const createStore = useStore('ali');
      const store = await createStore(context);
      for (const { filename } of magnets) {
        await store.upload({
          title: filename,
          filepath: path.join(localRoot, filename)
        });
      }
      info(
        'Upload   ' +
          lightGreen(anime.title) +
          ' OK ' +
          `(Total: ${magnets.length} episodes)`
      );
    }
  }
}

function formatEpisodeName(
  format: string | undefined,
  anime: Anime,
  ep: Episode
) {
  if (!format) format = '[{fansub}] {title} - {ep}.mp4';
  return format
    .replace('{fansub}', ep.fansub)
    .replace('{title}', anime.title)
    .replace('{ep}', (ep.ep < 10 ? '0' : '') + ep.ep);
}
