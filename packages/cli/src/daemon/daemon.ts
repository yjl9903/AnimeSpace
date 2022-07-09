import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, subMonths } from 'date-fns';
import { debug as createDebug } from 'debug';
import { dim, link, lightGreen, bold, lightCyan } from 'kolorist';

import type { Plan, EpisodeList } from '../types';
import type { Store, VideoInfo } from '../io';

import { context } from '../context';
import { checkVideo } from '../video';
import { TorrentClient, useStore } from '../io';
import { OnairEpisode, AdminClient } from '../client';
import { error, info, IndexListener } from '../logger';
import { Anime, Episode, daemonSearch, bangumiLink, formatEP } from '../anime';

const debug = createDebug('anime:daemon');

const titleColor = bold;
const startColor = lightCyan;
const okColor = lightGreen;

export class Daemon {
  private plans!: Plan[];
  private store!: Store;
  private client!: AdminClient;

  /**
   * Enable donwload and upload
   *
   * @default 'true'
   */
  private readonly enable: boolean;

  constructor(option: { update: boolean }) {
    this.enable = !option.update;
  }

  async init() {
    info('Start initing daemon ' + now());

    await this.refreshPlan();
    await this.refreshDatabase();
    await this.refreshEpisode();
    await this.downloadEpisode();

    info();
    info(okColor('Init daemon OK ') + now());
  }

  async update() {
    info('Start updating anime ' + now());

    await context.init({ force: false });
    await this.refreshPlan();
    await this.refreshDatabase();
    await this.refreshEpisode();
    await this.downloadEpisode();

    info();
    info(okColor('Update OK ') + now());
  }

  private async refreshPlan() {
    this.plans = await context.getPlans();
    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        info(
          'Onair    ' +
            titleColor(onair.title) +
            '    ' +
            `(${bangumiLink(onair.bgmId)})`
        );
      }
    }
  }

  private async refreshDatabase() {
    console.log();
    await context.magnetStore.index({
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
      for (const onair of plan.onair) {
        // Skip finished plan
        if (plan.state === 'finish' && (await context.getAnime(onair.bgmId))) {
          continue;
        }

        const keywords = Array.isArray(onair.keywords)
          ? onair.keywords
          : typeof onair.keywords === 'string'
          ? [onair.keywords]
          : undefined;

        await daemonSearch(onair.bgmId, keywords);

        const anime = await context.getAnime(onair.bgmId);

        if (anime) {
          info();
          info(
            okColor('Refresh  ') +
              titleColor(anime.title) +
              okColor(' OK ') +
              `(${bangumiLink(onair.bgmId)})`
          );
        } else {
          throw new Error(
            `Fail to init ${onair.title} (${bangumiLink(onair.bgmId)})`
          );
        }
      }
    }
  }

  private async downloadEpisode() {
    this.store = await useStore('ali')();
    this.client = new AdminClient({
      ...(await context.getServerConfig()),
      onairIds: new Set(this.plans.flatMap((p) => p.onair.map((o) => o.bgmId)))
    });
    await this.client.fetchOnair();

    for (const plan of this.plans) {
      for (const onair of plan.onair) {
        const anime = await context.getAnime(onair.bgmId);
        if (!anime) {
          error(`Fail to get ${onair.title} (${bangumiLink(onair.bgmId)})`);
          continue;
        }

        if (onair.link && typeof onair.link === 'string') {
          // Push online play bangumis
          this.client.updateOnair({
            title: onair.title,
            bgmId: onair.bgmId,
            episodes: [],
            link: onair.link
          });
          continue;
        }

        info();

        const epLink =
          onair.link && typeof onair.link !== 'string'
            ? resolveEP(onair.link)
            : new Map<number, string>();

        const givenMagnet = onair.magnet
          ? resolveEP(onair.magnet)
          : new Map<number, string>();
        const epMagnet = (
          await Promise.all(
            [...givenMagnet.entries()].map(async ([ep, magnet]) => {
              const m = await context.magnetStore.findById(magnet);
              if (!!m) {
                const parsedEP = anime.parseEpisode(m);
                parsedEP && (parsedEP.ep = ep);
                return parsedEP;
              }
            })
          )
        ).filter(Boolean) as Episode[];

        const episodes = anime
          .genEpisodes(onair.fansub ?? [])
          .filter((ep) => !givenMagnet.has(ep.ep))
          .concat(epMagnet)
          .filter((ep) => !epLink.has(ep.ep));

        info(
          startColor('Download ') +
            titleColor(anime.title) +
            '    ' +
            `(${bangumiLink(onair.bgmId)})`
        );
        for (const ep of episodes) {
          info(
            ` ${dim(formatEP(ep.ep))} ${
              ep.magnetName
                ? link(ep.magnetName, context.magnetStore.idToLink(ep.magnetId))
                : context.magnetStore.idToLink(ep.magnetId)
            }`
          );
        }

        // If not enable donwload and upload, continue
        if (!this.enable) continue;

        const magnets = await Promise.all(
          episodes.map(async (ep) => {
            return {
              magnetId: ep.magnetId,
              magnetURI: (await context.magnetStore.findById(ep.magnetId))!
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
          okColor('Download ') +
            titleColor(anime.title) +
            okColor(' OK ') +
            `(Total: ${magnets.length} episodes)`
        );

        // Format check (avoid HEVC / MKV)
        for (const { filename } of magnets) {
          if (!(await checkVideo(path.join(localRoot, filename)))) {
            error(`The format of ${filename} may be wrong`);
          }
        }

        // Start uploading
        info(
          startColor('Upload   ') +
            titleColor(anime.title) +
            '    ' +
            `(${bangumiLink(onair.bgmId)})`
        );
        const videoInfos: VideoInfo[] = [];
        for (const { filename, magnetId } of magnets) {
          const resp = await this.store.upload(path.join(localRoot, filename), {
            magnetId,
            retry: 3
          });
          if (resp && resp.playUrl.length > 0) {
            videoInfos.push(resp);
          } else {
            error(`Fail uploading ${filename}`);
          }
        }
        info(
          okColor('Upload   ') +
            titleColor(anime.title) +
            okColor(' OK ') +
            `(Total: ${magnets.length} episodes)`
        );
        for (let idx = 0; idx < episodes.length; idx++) {
          const ep = episodes[idx];
          const vInfo = videoInfos[idx];
          const title = vInfo.source.directory
            ? link(
                vInfo.title,
                pathToFileURL(
                  path.posix.join(
                    context.decodePath(vInfo.source.directory),
                    vInfo.title
                  )
                ).href
              )
            : vInfo.title;
          info(` ${dim(formatEP(ep.ep))} ${title}`);
        }
        // Upload OK

        const syncEpisodes: OnairEpisode[] = episodes.map((ep, idx) => ({
          ep: ep.ep,
          quality: ep.quality,
          creationTime: ep.creationTime,
          playURL: videoInfos[idx].playUrl[0],
          storage: {
            type: videoInfos[idx].platform,
            videoId: videoInfos[idx].videoId
          }
        }));

        this.client.updateOnair({
          title: anime.title,
          bgmId: anime.bgmId,
          episodes: [
            ...syncEpisodes,
            ...[...epLink.entries()].map(([ep, playURL]) => ({
              ep: +ep,
              playURL
            }))
          ].sort((a, b) => a.ep - b.ep)
        });

        await this.syncPlaylist(anime.title, anime.bgmId);
      }
    }

    await this.syncPlaylist();
  }

  private async syncPlaylist(title = '', curId = '') {
    if (curId === '') {
      info(
        `${startColor('Sync')}     ${this.client.onair.length} onair animes`
      );
    }
    if (title !== '') {
      info(
        `${startColor('Sync')}     ` +
          titleColor(title) +
          '    ' +
          `(${bangumiLink(curId)})`
      );
    }
    try {
      const onair = await this.client.syncOnair();
      for (const anime of onair) {
        if (anime.bgmId !== curId) continue;
        info(
          okColor('Sync     ') +
            titleColor(anime.title) +
            okColor(' OK ') +
            `(Total: ${anime.episodes.length} episodes)`
        );
        for (const ep of anime.episodes) {
          info(` ${dim(formatEP(ep.ep))} ${ep.playURL}`);
        }
      }
    } catch {
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

function resolveEP(eps: EpisodeList) {
  if (Array.isArray(eps)) {
    return new Map(eps.map((t, idx) => [idx, t]));
  } else {
    const map = new Map<number, string>();
    for (const [idx, ep] of Object.entries(eps)) {
      map.set(+idx, ep);
    }
    return map;
  }
}

function now() {
  return `(${format(new Date(), 'yyyy-MM-dd HH:mm')})`;
}
