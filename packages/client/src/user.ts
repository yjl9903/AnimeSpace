import axios, { AxiosInstance } from 'axios';

import type { OnairAnime } from './types';

export interface UserOption {
  baseURL?: string;
}

export class UserClient {
  private readonly token: string;
  private readonly api: AxiosInstance;

  constructor(token: string, option: UserOption = {}) {
    this.token = token;
    this.api = axios.create({
      baseURL: option.baseURL,
      headers: {
        Authorization: this.token
      }
    });
  }

  async fetchOnair() {
    const { data } = await this.api.get('/api/anime');
    if (data.status !== 'Ok') throw new Error('Unknown error');
    const bgms = data.data.onair as OnairAnime[];
    return bgms;
  }
}
