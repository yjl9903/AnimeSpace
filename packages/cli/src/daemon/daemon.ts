import * as fs from 'fs-extra';
import * as path from 'node:path';
import { bold, dim, link } from 'kolorist';
import { format, subMonths } from 'date-fns';

import type { Episode } from '@animepaste/database';

import type { Store, VideoInfo } from '../io';
import type { OnairPlan, EpisodesInputList } from '../types';

import { context } from '../context';
import { MAX_RETRY } from '../constant';
import { formatEP, formatEpisodeName } from '../utils';
import {
  logger,
  IndexListener,
  titleColor,
  startColor,
  okColor
} from '../logger';
import { OnairEpisode, initClient, SyncClient } from '../client';
import { daemonSearch, bangumiLink } from '../anime';
import { TorrentClient, useStore, checkVideo } from '../io';

import { Plan } from './plan';
import { debug } from './constant';

export interface DaemonStepOption {
  /**
   * Filter onair plan
   */
  filter?: (onair: OnairPlan) => boolean;

  /**
   * Enable log
   */
  log?: boolean;
}

export class Daemon {
  private plan!: Plan;
  private store!: Store;
  private client!: SyncClient;

  /**
   * Enable sync onair list
   *
   * @default 'true'
   */
  private readonly enableSync: boolean;

  /**
   * Enable upload
   *
   * @default 'true'
   */
  private readonly enableUpload: boolean;

  constructor(option: { sync: boolean; upload: boolean }) {
    this.enableUpload = option.upload;
    if (this.enableUpload) {
      this.enableSync = option.sync;
    } else {
      this.enableSync = false;
    }
  }

  async init() {
    try {
      logger.info('Start initing daemon ' + now());

      await this.initPlan();
      await this.refreshDatabase();
      await this.initClient();
      await this.refreshEpisode({ log: false });
      await this.refreshStore();

      logger.empty();
      logger.info(okColor('Init daemon OK ') + now());
    } catch (error: any) {
      debug(error);
      if ('message' in error) {
        logger.error(error.message);
      }
      logger.info(okColor('Init daemon Fail ') + now());
    }
  }

  async update() {
    try {
      logger.empty();
      logger.info('Start updating anime ' + now());

      await context.init({ force: false });
      await this.initPlan();
      await this.refreshDatabase();
      await this.initClient();
      await this.refreshEpisode({ log: false });
      await this.refreshStore();

      logger.empty();
      logger.info(okColor('Update OK ') + now());
    } catch (error: any) {
      debug(error);
      if ('message' in error) {
        logger.error(error.message);
      }
      logger.info(okColor('Update Fail ') + now());
    }
  }

  public async initPlan({ log = true }: DaemonStepOption = {}) {
    this.plan = await Plan.create();
    if (log) {
      logger.empty();
      this.plan.printOnair();
    }
  }

  public async initClient() {
    this.client = await initClient();
    await this.client.fetchOnair();
  }

  private async refreshDatabase() {
    logger.empty();
    await context.magnetStore.index({
      limit: subMonths(
        new Date(Math.min(...[...this.plan].map((p) => p.date.getTime()))),
        1
      ),
      earlyStop: !context.cliOption.force,
      listener: IndexListener
    });
  }

  /**
   * Refresh episode magnet list
   *
   * Prerequisite: this.initPlan(), this.initClient()
   */
  public async refreshEpisode({ log = true, filter }: DaemonStepOption = {}) {
    let count = 0;

    if (!log) {
      logger.empty();
    }

    if (!this.plan) {
      throw new Error('Please init plan first');
    }
    if (!this.client) {
      throw new Error('Please init client first');
    }

    for (const onair of this.plan.onairs()) {
      // Skip finished onair bangumi
      if (
        onair.state === 'finish' &&
        this.client.onair.find((o) => o.bgmId === onair.bgmId)
      ) {
        continue;
      }

      // Continue outside onair anime
      if (onair.link && typeof onair.link === 'string') {
        continue;
      }

      if (filter && !filter(onair)) {
        continue;
      }

      const keywords = Array.isArray(onair.keywords)
        ? onair.keywords
        : typeof onair.keywords === 'string'
        ? [onair.keywords]
        : undefined;

      await daemonSearch(onair.bgmId, keywords, {
        type: 'tv',
        title: onair.title,
        log: log
      });

      logger.info(
        okColor('Refresh  ') +
          formatTitle(onair.title, onair.season) +
          okColor(' OK ') +
          `(${bangumiLink(onair.bgmId)})`
      );
      count++;
    }

    logger.info(
      `${okColor('Refresh  ')}${count} onair animes ${okColor('OK')}`
    );
  }

  private async refreshStore() {
    this.store = await useStore('ali')();

    for (const plan of this.plan) {
      for (const onair of plan.onair) {
        // Sync online play bangumis
        if (onair.link && typeof onair.link === 'string') {
          this.client.updateOnair({
            title: onair.title,
            bgmId: onair.bgmId,
            episodes: [],
            link: onair.link
          });
          continue;
        }
        // Skip finish plan and anime is onairing
        if (
          plan.state === 'finish' &&
          this.client.onair.find((o) => o.bgmId === onair.bgmId)
        ) {
          continue;
        }

        logger.empty();

        await this.refreshAnime(onair);
        await this.syncPlaylist(onair);
      }
    }

    await this.syncPlaylist();
  }

  private async refreshAnime(onair: OnairPlan) {
    const epLink =
      onair.link && typeof onair.link !== 'string'
        ? resolveEP(onair.link)
        : new Map<number, string>();

    const epSource = onair.source
      ? resolveEP(onair.source)
      : new Map<number, string>();

    const givenMagnet = onair.magnet
      ? resolveEP(onair.magnet)
      : new Map<number, string>();
    const epMagnet = (
      await Promise.all(
        [...givenMagnet.entries()].map(async ([ep, magnetId]) => {
          const magnet = await context.magnetStore.findById(magnetId);
          if (!!magnet) {
            const res = await context.episodeStore.createEpisode(
              onair.bgmId,
              magnet
            );
            if (res && res.ep === ep) {
              return res;
            } else {
              return undefined;
            }
          }
        })
      )
    ).filter(Boolean) as Episode[];

    const episodes = this.plan
      .genEpisodes(
        await context.episodeStore.listEpisodes(onair.bgmId),
        onair.fansub ?? []
      )
      .filter((ep) => !givenMagnet.has(ep.ep))
      .concat(epMagnet)
      .filter((ep) => !epLink.has(ep.ep))
      .filter((ep) => !epSource.has(ep.ep));

    logger.info(
      startColor('Download ') +
        formatTitle(onair.title, onair.season) +
        '    ' +
        `(${bangumiLink(onair.bgmId)})`
    );
    for (const ep of episodes) {
      logger.tab.info(
        `${dim(formatEP(ep.ep))} ${
          ep.magnet.title
            ? link(ep.magnet.title, context.magnetStore.idToLink(ep.magnet.id))
            : context.magnetStore.idToLink(ep.magnet.id)
        }`
      );
    }

    const localRoot = await context.makeLocalAnimeRoot(onair.title);

    type InlineMagnet = {
      magnetId: string;
      magnetURI: string;
      filename: string;
    };

    const serverOnair = this.client.onair.find((o) => o.bgmId === onair.bgmId);
    debug(serverOnair);
    const getServerMagnet = (magnet: InlineMagnet) => {
      if (serverOnair) {
        for (const ep of serverOnair.episodes) {
          if (
            'storage' in ep &&
            ep.storage &&
            ep.storage.type &&
            ep.storage.videoId &&
            ep.storage.source
          ) {
            const source = ep.storage.source;
            if (source.magnetId === magnet.magnetId) {
              return ep;
            }
          }
        }
        return undefined;
      } else {
        return undefined;
      }
    };

    const magnets: InlineMagnet[] = (
      await Promise.all(
        episodes.map(async (ep) => {
          const magnet = await context.magnetStore.findById(ep.magnet.id);
          if (!magnet) {
            logger.error(
              `Can not find magnet (ID: ${link(
                ep.magnet.id,
                context.magnetStore.idToLink(ep.magnet.id)
              )})`
            );
          }
          return {
            magnetId: ep.magnet.id,
            magnetURI: magnet?.magnet ?? '',
            filename: formatEpisodeName(onair, ep)
          };
        })
      )
    ).filter((m) => Boolean(m.magnetURI));

    // Start downloading
    {
      const shouldDownloadMagnet = magnets.filter((m) => !getServerMagnet(m));
      if (shouldDownloadMagnet.length > 0) {
        const torrent = new TorrentClient(localRoot);
        await torrent.download(shouldDownloadMagnet);
        await torrent.destroy();

        // Format check (avoid HEVC / MKV)
        for (const { filename } of shouldDownloadMagnet) {
          if (!(await checkVideo(path.join(localRoot, filename)))) {
            logger.warn(`The format of ${filename} may be wrong`);
          }
        }
      }
      logger.info(
        okColor('Download ') +
          formatTitle(onair.title, onair.season) +
          okColor(' OK ') +
          `(Total: ${magnets.length} episodes)`
      );
    }
    // Download OK

    // Start uploading
    const videoInfos: VideoInfo[] = [];
    if (this.enableUpload) {
      logger.info(
        startColor('Upload   ') +
          formatTitle(onair.title, onair.season) +
          '    ' +
          `(${bangumiLink(onair.bgmId)})`
      );
      for (const magnet of magnets) {
        const serverMagnet = getServerMagnet(magnet);
        if (serverMagnet) {
          const foundVideo = await context.videoStore.findVideo(
            serverMagnet.storage.type!,
            serverMagnet.storage.videoId!
          );
          if (foundVideo) {
            debug(`${magnet.filename} has been uploaded`);
            videoInfos.push(foundVideo);
            continue;
          }
        } else {
          debug(`Can not find ${magnet.filename} on server, and try uploading`);
        }

        // Do upload
        {
          const { filename, magnetId } = magnet;

          // Check whether server onair bangumi is deleted
          if (!fs.existsSync(path.join(localRoot, filename))) {
            continue;
          }

          const resp = await this.store.upload(path.join(localRoot, filename), {
            magnetId,
            retry: MAX_RETRY
          });
          if (resp && resp.playUrl.length > 0) {
            // Fix missing magnetId
            if (!resp.source.magnetId) {
              resp.source.magnetId = magnetId;
              await context.videoStore.updateVideo(resp);
            }
            videoInfos.push(resp);
          } else {
            logger.error(`Fail uploading ${filename}`);
          }
        }
      }
      logger.info(
        okColor('Upload   ') +
          formatTitle(onair.title, onair.season) +
          okColor(' OK ') +
          `(Total: ${magnets.length} episodes)`
      );
    }
    // Upload OK

    // Start modify onair info
    if (this.enableUpload) {
      episodes.splice(videoInfos.length);
      const syncEpisodes: OnairEpisode[] = episodes.map((ep, idx) => ({
        ep: ep.ep,
        quality: ep.quality,
        creationTime: ep.magnet.createdAt.toISOString(),
        playURL: videoInfos[idx].playUrl[0],
        storage: {
          type: videoInfos[idx].platform,
          videoId: videoInfos[idx].videoId,
          source: videoInfos[idx].source
        }
      }));

      this.client.updateOnair({
        title: onair.title,
        bgmId: onair.bgmId,
        episodes: [
          ...syncEpisodes,
          ...[...epLink.entries()].map(([ep, playURL]) => ({
            ep: +ep,
            playURL
          }))
        ].sort((a, b) => a.ep - b.ep)
      });
    }
  }

  private async syncPlaylist(onair?: OnairPlan) {
    if (!this.enableSync) return;

    if (!onair) {
      logger.info(
        `${startColor('Sync')}     ${bold(
          this.client.newOnair.length
        )}  local onair animes`
      );
    } else {
      logger.info(
        `${startColor('Sync')}     ` +
          formatTitle(onair.title, onair.season) +
          '    ' +
          `(${bangumiLink(onair.bgmId)})`
      );
    }

    try {
      const onairs = await this.client.syncOnair();
      if (!onair) {
        logger.info(
          `${okColor('Sync')}     ${bold(
            onairs.length
          )} remote onair animes ${okColor('OK')}`
        );
      } else {
        for (const remoteOnair of onairs) {
          if (onair.bgmId !== remoteOnair.bgmId) continue;
          logger.info(
            okColor('Sync     ') +
              formatTitle(onair.title, onair.season) +
              okColor(' OK ') +
              `(Total: ${bold(remoteOnair.episodes.length)} episodes)`
          );
          for (const ep of remoteOnair.episodes) {
            logger.tab.info(`${dim(formatEP(ep.ep))} ${ep.playURL}`);
          }
        }
      }
    } catch {
      logger.error(`Fail connecting server`);
    }
  }
}

function resolveEP(eps: EpisodesInputList) {
  if (Array.isArray(eps)) {
    return new Map(eps.map((t, idx) => [idx + 1, t]));
  } else {
    const map = new Map<number, string>();
    for (const [idx, ep] of Object.entries(eps)) {
      map.set(+idx, ep);
    }
    return map;
  }
}

function formatTitle(title: string, season: number) {
  return titleColor(title + (season > 1 ? ` Season ${season}` : ''));
}

function now() {
  return `(${format(new Date(), 'yyyy-MM-dd HH:mm')})`;
}
