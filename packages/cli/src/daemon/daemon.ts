import path from 'node:path';
import { format, subMonths } from 'date-fns';
import { debug as createDebug } from 'debug';
import { dim, link, lightGreen } from 'kolorist';

import type { Plan, VideoInfo } from '../types';

import { context } from '../context/';
import { checkVideo } from '../video';
import { bangumiLink } from '../utils';
import { TorrentClient, useStore } from '../io';
import { error, info, IndexListener } from '../logger';
import { Anime, Episode, daemonSearch, formatEP } from '../anime';
import { OnairAnime, OnairEpisode, AdminClient } from '../client';

const debug = createDebug('anime:daemon');

export class Daemon {
  private plans!: Plan[];

  private readonly enable: boolean;

  constructor(option: { update: boolean }) {
    this.enable = !option.update;
  }

  async init() {
    info('Start initing daemon ' + now());

    this.plans = await context.getPlans();

    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        info(
          'Onair    ' +
            lightGreen(onair.name) +
            ' ' +
            `(${bangumiLink(onair.bgmId)})`
        );
      }
    }

    await this.refreshDatabase();
    await this.refreshEpisode();
    await this.downloadEpisode();

    info('Init daemon OK ' + now());
  }

  async update() {
    info('Start updating anime ' + now());

    await this.refreshDatabase();
    await this.refreshEpisode();
    await this.downloadEpisode();

    info('Update OK ' + now());
  }

  private async refreshDatabase() {
    console.log();
    await context.database.index({
      limit: subMonths(
        new Date(Math.min(...this.plans.map((p) => p.date.getTime()))),
        3
      ),
      earlyStop: !context.cliOption.force,
      listener: IndexListener
    });
  }

  private async refreshEpisode() {
    for (const plan of this.plans) {
      // Skip finished plan
      if (plan.state === 'finish') continue;

      for (const onair of plan.onair) {
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
    }
  }

  private async downloadEpisode() {
    const syncOnair: OnairAnime[] = [];

    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        const anime = await context.getAnime(onair.bgmId);
        if (!anime) {
          throw new Error(
            `Fail to get ${onair.name} (${bangumiLink(onair.bgmId)})`
          );
        }

        if (!onair.fansub) {
          if (onair.link) {
            // Push online play bangumis
            syncOnair.push({
              title: onair.name,
              bgmId: onair.bgmId,
              episodes: [],
              link: onair.link
            });
          }
          continue;
        }

        const episodes = anime
          .genEpisodes(onair.fansub)
          .filter((ep) => !(String(ep.ep) in (onair.ep ?? {})));

        info(
          'Download ' +
            lightGreen(anime.title) +
            ' ' +
            `(${bangumiLink(onair.bgmId)})`
        );
        for (const ep of episodes) {
          info(
            ` ${dim(formatEP(ep.ep))} ${link(
              ep.magnetName,
              context.database.formatMagnetLink(ep.magnetId)
            )}`
          );
        }

        if (!this.enable) return;

        const magnets = await Promise.all(
          episodes.map(async (ep) => {
            return {
              // magnetURI: this.magnetCache.get(ep.magnetId)!,
              magnetURI: (await context.database.findByLink(ep.magnetId))!
                .magnet,
              filename: formatEpisodeName(onair.format, anime, ep)
            };
          })
        );

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

        for (const { filename } of magnets) {
          const ok = await checkVideo(path.join(localRoot, filename));
          if (!ok) {
            error(`The format of ${filename} may be wrong`);
          }
        }

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
          const func = async (count = 0) => {
            if (count > 3) return;
            try {
              const resp = await store.upload({
                title: filename,
                filepath: path.join(localRoot, filename)
              });
              if (resp && resp.playUrl.length > 0) {
                playURLs.push(resp);
              }
            } catch (err) {
              error(`Uploading ${filename} encounter some errors`);
              const msg = (err as any).message;
              if (msg) error(msg);
              await func(count + 1);
            }
          };
          await func();
        }
        info(
          'Upload   ' +
            lightGreen(anime.title) +
            ' OK ' +
            `(Total: ${magnets.length} episodes)`
        );

        const syncEpisodes: OnairEpisode[] = episodes.map((ep, idx) => ({
          ep: ep.ep,
          quality: ep.quality,
          creationTime: ep.creationTime,
          playURL: playURLs[idx].playUrl[0],
          storage: {
            type: playURLs[idx].store,
            videoId: playURLs[idx].videoId
          }
        }));

        syncOnair.push({
          title: anime.title,
          bgmId: anime.bgmId,
          episodes: [
            ...syncEpisodes,
            ...Object.entries(onair.ep ?? {}).map(([ep, playURL]) => ({
              ep: +ep,
              playURL
            }))
          ].sort((a, b) => a.ep - b.ep)
        });

        await this.syncPlaylist(syncOnair, anime.bgmId);
      }
    }
    await this.syncPlaylist(syncOnair);
  }

  private async syncPlaylist(syncOnair: OnairAnime[], curId = '') {
    info(`Syncing  ${syncOnair.length} onair animes`);
    const client = new AdminClient(await context.getServerConfig());
    try {
      const onair = await client.syncOnair(syncOnair);
      for (const anime of onair) {
        if (anime.bgmId !== curId) continue;
        info(
          'Sync     ' +
            lightGreen(anime.title) +
            ' OK ' +
            `(Total: ${anime.episodes.length} episodes)`
        );
        for (const ep of anime.episodes) {
          info(` ${dim(formatEP(ep.ep))} ${ep.playURL}`);
        }
      }
    } catch (err) {
      error(`Fail connecting server (baseURL or token may be wrong)`);
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
    .replace('{ep}', formatEP(ep.ep, '0'));
}

function now() {
  return `(${format(new Date(), 'yyyy-MM-dd HH:mm')})`;
}
