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
    const { data } = await this.api.get('/api/play');
    if (data.status !== 'Ok') throw new Error('Unknown error');
    console.log(data.data.timestamp);
    return {
      onair: data.data.onair as OnairAnime[],
      timestamp: new Date(data.data.timestamp)
    };
  }

  async userSync(content: object) {
    await this.api.post('/api/user/sync', content);
  }

  async fetchUserSync() {
    const { data } = await this.api.get<{ data: { content: string } }>(
      '/api/user/sync'
    );
    return data.data.content;
  }
}
