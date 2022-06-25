import path from 'node:path';
import { debug as createDebug } from 'debug';
import { dim, link, lightGreen, options } from 'kolorist';

import type { Plan, VideoInfo } from '../types';

import { context } from '../context/';
import { bangumiLink } from '../utils';
import { TorrentClient, useStore } from '../io';
import { OnairAnime, AdminClient } from '../client';
import { Anime, Episode, daemonSearch, formatMagnetURL } from '../anime';

import { error, info } from './utils';

const debug = createDebug('anime:daemon');

export class Daemon {
  private plan!: Plan;
  private magnetCache!: Map<string, string>;

  private readonly enable: boolean;

  constructor(option: { update: boolean }) {
    this.enable = !option.update;
  }

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

      await daemonSearch(
        onair.bgmId,
        Array.isArray(onair.keywords)
          ? onair.keywords
          : typeof onair.keywords === 'string'
          ? [onair.keywords]
          : undefined
      );

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
    const syncOnair: OnairAnime[] = [];

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

      if (!this.enable) return;

      const magnets = episodes.map((ep) => {
        return {
          magnetURI: this.magnetCache.get(ep.magnetId)!,
          filename: formatEpisodeName(onair.format, anime, ep)
        };
      });
      const localRoot = await context.makeLocalAnimeRoot(anime.title);
      const torrent = new TorrentClient(localRoot);
      for (const items of magnets.reduce((resultArray, item, index) => {
        const perChunk = 10;
        const chunkIndex = Math.floor(index / perChunk);
        if (!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = [];
        }
        resultArray[chunkIndex].push(item);
        return resultArray;
      }, [] as Array<{ magnetURI: string; filename: string }>[])) {
        await torrent.download(items);
      }
      await torrent.destroy();
      info(
        'Download ' +
          lightGreen(anime.title) +
          ' OK ' +
          `(Total: ${magnets.length} episodes)`
      );

      info(
        'Upload   ' +
          lightGreen(anime.title) +
          ' ' +
          `(${bangumiLink(onair.bgmId)})`
      );
      const createStore = useStore('ali');
      const store = await createStore(context);
      const playURLs: VideoInfo[] = [];
      for (const { filename } of magnets) {
        const resp = await store.upload({
          title: filename,
          filepath: path.join(localRoot, filename)
        });
        if (resp && resp.playUrl.length > 0) {
          playURLs.push(resp);
        } else {
          error(`Uploading ${filename} encounter some errors`);
        }
      }
      info(
        'Upload   ' +
          lightGreen(anime.title) +
          ' OK ' +
          `(Total: ${magnets.length} episodes)`
      );

      syncOnair.push({
        title: anime.title,
        bgmId: anime.bgmId,
        episodes: episodes.map((ep, idx) => ({
          ep: ep.ep,
          quality: ep.quality,
          creationTime: ep.creationTime,
          playURL: playURLs[idx].playUrl[0],
          storage: {
            type: playURLs[idx].store,
            videoId: playURLs[idx].videoId
          }
        }))
      });

      info(`Syncing  ${syncOnair.length} onair animes`);
      const client = new AdminClient(await context.getServerConfig());
      try {
        const onair = await client.syncOnair(syncOnair);
        for (const anime of onair) {
          info(
            'Sync     ' +
              lightGreen(anime.title) +
              ' OK ' +
              `(Total: ${anime.episodes.length} episodes)`
          );
          for (const ep of anime.episodes) {
            info(`${ep.ep < 10 ? ' ' : ''}${dim(ep.ep)} ${ep.playURL}`);
          }
        }
      } catch (err) {
        debug(err);
        error(`Server baseURL or token may be wrong`);
      }
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
