import axios, { AxiosInstance } from 'axios';
import { debug as createDebug } from 'debug';

import type { OnairAnime, UserOption } from './types';

const debug = createDebug('anime:client');

export class AdminClient {
  private static MAX_RETRY = 5;

  private readonly token: string;
  private readonly api: AxiosInstance;

  constructor(option: UserOption) {
    this.token = option.token;
    this.api = axios.create({
      baseURL: option.baseURL,
      headers: {
        Authorization: this.token
      }
    });
  }

  async syncOnair(
    onair: OnairAnime[],
    option: { retry?: number } = {}
  ): Promise<OnairAnime[]> {
    try {
      const { data } = await this.api.post('/admin/anime', { onair });
      if (data.status !== 'Ok') throw new Error('Unknown error');
      return data.data.onair;
    } catch (error) {
      debug(error);
      const retry = (option?.retry ?? 0) + 1;
      if (retry > AdminClient.MAX_RETRY) {
        throw new Error('Fail syncing onair animes');
      } else {
        return this.syncOnair(onair, { retry });
      }
    }
  }

  async fetchOnair() {
    const { data } = await this.api.get('/play');
    if (data.status !== 'Ok') throw new Error('Unknown error');
    return data.data.onair as OnairAnime[];
  }
}
