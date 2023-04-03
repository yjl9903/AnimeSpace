import path from 'node:path';

import OSS from 'ali-oss';
import onDeath from 'death';
import RPCClient from '@alicloud/pop-core';
import createDebug from 'debug';

import { logger } from '../../logger';
import { context } from '../../context';
import { MAX_RETRY } from '../../constant';

import type { VideoInfo } from '../types';

import { b64decode, createProgressBar } from '../utils';

import { CreateStore, Store, StoreOption } from './base';

const debug = createDebug('anime:ali');

const TIMEOUT = 10 * 1000;

export class AliStore extends Store {
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly regionId: string;

  private readonly vodClient: RPCClient;

  constructor(config: AliStoreConfig) {
    super('ali');

    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.regionId = config.regionId;

    this.vodClient = new RPCClient({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      endpoint: 'http://vod.' + this.regionId + '.aliyuncs.com',
      apiVersion: '2017-03-21'
    });
  }

  private async createUplodaVideo(
    title: string,
    file: string
  ): Promise<UploadResponse | undefined> {
    for (let i = 0; i < MAX_RETRY; i++) {
      try {
        const res = await Promise.race([
          this.vodClient.request<any>(
            'CreateUploadVideo',
            {
              Title: title,
              FileName: file
            },
            {
              timeout: TIMEOUT
            }
          ),
          new Promise((res) => setTimeout(() => res(undefined), TIMEOUT * 6))
        ]);
        if (res) {
          res.UploadAuth = JSON.parse(b64decode(res.UploadAuth));
          res.UploadAddress = JSON.parse(b64decode(res.UploadAddress));
          return res as UploadResponse;
        }
      } catch (error) {
        debug(error);
        return undefined;
      }
    }
    logger.error(`Create Upload ${title} timeout`);
    return undefined;
  }

  async doUpload(
    filepath: string,
    option: StoreOption = {}
  ): Promise<string | undefined> {
    debug(`Upload: ${filepath}`);

    const resp = await this.createUplodaVideo(
      path.basename(filepath),
      filepath
    );
    if (!resp) {
      throw new Error('Fail creating upload video');
    } else {
      debug(resp);
    }

    const store = new OSS({
      endpoint: resp.UploadAddress.Endpoint,
      bucket: resp.UploadAddress.Bucket,
      accessKeyId: resp.UploadAuth.AccessKeyId,
      accessKeySecret: resp.UploadAuth.AccessKeySecret,
      stsToken: resp.UploadAuth.SecurityToken,
      async refreshSTSToken() {
        // TODO: fetch refreshSTSToken
        return {
          accessKeyId: resp.UploadAuth.AccessKeyId,
          accessKeySecret: resp.UploadAuth.AccessKeySecret,
          stsToken: resp.UploadAuth.SecurityToken
        };
      },
      refreshSTSTokenInterval: 60 * 60 * 1000
    });

    const formatSize = (size: number) =>
      (size / 1024 / 1024).toFixed(1) + ' MB';
    const multibar = createProgressBar<{
      value: number;
      total: number;
      speed?: number;
    }>({
      suffix(_value, _total, payload) {
        const progress = `${formatSize(payload.value)} / ${formatSize(
          payload.total
        )}`;
        const speed = payload.speed
          ? ' | Speed: ' + formatSize(payload.speed) + '/s'
          : '';
        return progress + speed;
      }
    });

    const cancel = onDeath(async () => {
      option.retry = undefined;
      logger.error('Process is terminated');
      await this.doDelete(resp.VideoId);
      logger.info('Clear OK');
    });

    try {
      const bar = multibar.create(path.basename(filepath), 1);

      const ossRes = await store.multipartUpload(
        resp.UploadAddress.FileName,
        filepath,
        {
          progress(p: number, c: Checkpoint) {
            bar.update(p, {
              value: Number((c.fileSize * p).toFixed(0)),
              total: c.fileSize
            });
          }
        }
      );
      debug(ossRes);

      return resp.VideoId;
    } catch (err) {
      debug(err);

      logger.error('Upload error, please DO NOT exit!');
      await this.doDelete(resp.VideoId);
      logger.info('Clear OK');

      if (option.retry === undefined || option.retry === 0) {
        return undefined;
      } else {
        option.retry -= 1;
        return this.doUpload(filepath, option);
      }
    } finally {
      cancel();
      multibar.finish();
    }
  }

  async doDelete(videoId: string) {
    try {
      await this.vodClient.request('DeleteVideo', { VideoIds: videoId }, {});
      return true;
    } catch {
      return false;
    }
  }

  async doFetchVideoInfo(videoId: string): Promise<VideoInfo | undefined> {
    try {
      const [resp, play] = await Promise.all([
        this.vodClient.request(
          'GetVideoInfo',
          {
            VideoId: videoId
          },
          {
            timeout: TIMEOUT
          }
        ) as Promise<any>,
        this.vodClient.request(
          'GetPlayInfo',
          {
            VideoId: videoId
          },
          { timeout: TIMEOUT }
        ) as Promise<any>
      ]);
      debug(resp, play);
      return {
        platform: 'ali',
        videoId,
        title: resp.Video.Title,
        cover: resp.Video.CoverURL,
        createdAt: resp.Video.CreationTime,
        playUrl: (play?.PlayInfoList?.PlayInfo ?? [])
          .map((p: any) => p?.PlayURL)
          .filter(Boolean),
        source: {}
      };
    } catch (error) {
      debug(error);
      return undefined;
    }
  }
}

export const createAliStore: CreateStore = async () => {
  const config = await context.getStoreConfig<AliStoreConfig>('ali');
  if (
    !Boolean(config.accessKeyId) ||
    !Boolean(config.accessKeySecret) ||
    !Boolean(config.regionId)
  ) {
    throw new Error('Fail to load Ali OSS config');
  }
  const ali = new AliStore(config);
  await ali.init();
  return ali;
};

export interface AliStoreConfig {
  accessKeyId: string;
  accessKeySecret: string;
  regionId: string;
}

export interface UploadResponse {
  VideoId: string;
  RequestId: string;
  UploadAddress: {
    Endpoint: string;
    Bucket: string;
    FileName: string;
  };
  UploadAuth: {
    SecurityToken: string;
    AccessKeyId: string;
    AccessKeySecret: string;
    Region: string;
    Expiration: string;
    ExpireUTCTime: string;
  };
}

export interface Checkpoint {
  file: string;
  name: string;
  fileSize: number;
  partSize: number;
  uploadId: string;
  doneParts: Array<{
    number: number;
    etag: string;
  }>;
}
