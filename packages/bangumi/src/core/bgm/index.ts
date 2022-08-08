import axios from 'axios';

import type { BaseBangumi, Calendar, ExtendBangumiSubject } from '../types';

import type { RawCalendar, Subject } from './types';

export * from './types';

export class BgmClient<T extends BaseBangumi> {
  static baseURL = 'https://api.bgm.tv';

  static maxRetry = 5;

  private readonly api = axios.create({
    baseURL: BgmClient.baseURL,
    timeout: 10 * 1000
  });

  private readonly bangumis: Map<string, T>;

  constructor(bangumis: T[] = []) {
    this.bangumis = new Map(bangumis.map((bgm) => [bgm.bgmId, bgm]));
  }

  async fetchRawCalendar(): Promise<RawCalendar[]> {
    const { data } = await this.api.get('/calendar');
    return data;
  }

  async fetchRawSubject(bgmId: string): Promise<Subject | undefined> {
    for (let i = 0, time = 1; i <= BgmClient.maxRetry; i++, time *= 2) {
      try {
        const { data } = await this.api.get(`/v0/subjects/${bgmId}`);
        return data;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const { response } = err;
          if (response?.status === 404) {
            return undefined;
          }
        }
        if (i === BgmClient.maxRetry) {
          throw err;
        }
        await sleep(time);
      }
    }
    throw new Error('unreachable');
  }

  async fetchCalendar(): Promise<Calendar<T>[]> {
    const data = await this.fetchRawCalendar();

    return data.map((d) => ({
      weekday: d.weekday,
      bangumis: d.items.map((d) => ({
        // TODO: make typecheck pass
        ...this.bangumis.get(String(d.id))!,
        bgmId: String(d.id),
        title: d.name,
        titleCN: d.name_cn,
        type: 'tv',
        begin: d.air_date,
        bgm: {
          summary: d.summary,
          images: d.images,
          eps: d.eps,
          rating: d.rating
        }
      }))
    }));
  }

  async fetchSubject(bgm: T | string): Promise<T & ExtendBangumiSubject> {
    const id = typeof bgm === 'string' ? bgm : bgm.bgmId;

    const subject = await this.fetchRawSubject(id);

    if (!subject) {
      throw new Error(`${id} is not found`);
    }

    // TODO: check why typecheck wrong
    // @ts-ignore
    return {
      bgmId: id,
      type: 'tv',
      ...(typeof bgm === 'string' ? undefined : bgm),
      title: subject.name,
      titleCN: subject.name_cn,
      bgm: {
        summary: subject.summary,
        images: subject.images,
        eps: subject.total_episodes ?? subject.eps,
        rating: subject.rating,
        subject: {
          infobox: subject.infobox,
          tags: subject.tags
        }
      }
    };
  }
}

function sleep(second = 1): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), second * 1000);
  });
}
