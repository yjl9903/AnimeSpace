import axios, { AxiosInstance } from 'axios';

import type { OnairAnime, UserOption } from './types';

export class AdminClient {
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

  async syncOnair(onair: OnairAnime[]): Promise<OnairAnime[]> {
    const { data } = await this.api.post('/admin/anime', { onair });
    return data.data.onair;
  }

  async fetchOnair() {
    const { data } = await this.api.get('/anime');
    if (data.status !== 'Ok') throw new Error('Unknown error');
    return data.data.onair as OnairAnime[];
  }
}
