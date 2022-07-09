import path from 'node:path';

import OSS from 'ali-oss';
import onDeath from 'death';
import RPCClient from '@alicloud/pop-core';
import { debug as createDebug } from 'debug';

import { context } from '../../context';
import { error, info } from '../../logger';

import type { VideoInfo } from '../types';

import { b64decode, createProgressBar } from '../utils';

import { CreateStore, Store } from './types';

const debug = createDebug('anime:ali');

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
    try {
      const res = (await this.vodClient.request('CreateUploadVideo', {
        Title: title,
        FileName: file
      })) as any;
      res.UploadAuth = JSON.parse(b64decode(res.UploadAuth));
      res.UploadAddress = JSON.parse(b64decode(res.UploadAddress));
      return res as UploadResponse;
    } catch (error) {
      debug(error);
      return undefined;
    }
  }

  async doUpload(filepath: string): Promise<string | undefined> {
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

    const progressbar = createProgressBar({});

    try {
      const bar = progressbar.create(path.basename(filepath), 1);
      const cancel = onDeath(async () => {
        error('Process is terminated');
        await this.doDelete(resp.VideoId);
        info('Clear OK');
      });

      const ossRes = await store.multipartUpload(
        resp.UploadAddress.FileName,
        filepath,
        {
          progress(p: number, _c: Checkpoint) {
            bar.update(p);
          }
        }
      );
      cancel();
      debug(ossRes);

      return resp.VideoId;
    } catch (err) {
      debug(err);

      error('Upload error, please DO NOT exit!');
      await this.doDelete(resp.VideoId);
      info('Clear OK');

      return undefined;
    } finally {
      progressbar.finish();
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
          {}
        ) as Promise<any>,
        this.vodClient.request(
          'GetPlayInfo',
          {
            VideoId: videoId
          },
          {}
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
  doneParts: {
    number: number;
    etag: string;
  };
}
