import axios, { AxiosInstance } from 'axios';

export interface OnairAnime {
  name: string;

  bgmId: string;

  episodes: OnairEpisode[];
}

export interface OnairEpisode {
  /**
   * 条目内的集数, 从 1 开始
   */
  ep: number;

  /**
   * Video qulity
   */
  quality: 1080 | 720;

  /**
   * Airdate
   */
  creationTime: string;

  /**
   * Play url
   */
  playURL: string;
}

export interface UserOption {
  token: string;
  baseURL: string;
}

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

  async fetchOnair() {
    const { data } = await this.api.get('/api/anime');
    if (data.status !== 'Ok') throw new Error('Unknown error');
    return data.data.onair as OnairAnime[];
  }
}
