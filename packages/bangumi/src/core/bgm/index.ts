import axios from 'axios';

import type { BaseBangumi, Calendar, ExtendBangumiSubject } from '../types';

import type { RawCalendar, Subject } from './types';

export * from './types';

export const baseURL = 'https://api.bgm.tv';

export class BgmClient {
  private readonly api = axios.create({
    baseURL,
    timeout: 10 * 1000
  });

  async fetchRawCalendar(): Promise<RawCalendar[]> {
    const { data } = await this.api.get('/calendar');
    return data;
  }

  async fetchRawSubject(bgmId: string): Promise<Subject> {
    const { data } = await this.api.get(`/v0/subjects/${bgmId}`);
    return data;
  }

  async fetchCalendar(): Promise<Calendar[]> {
    const data = await this.fetchRawCalendar();

    return data.map((d) => ({
      weekday: d.weekday,
      bangumis: d.items.map((d) => ({
        bgmId: String(d.id),
        title: d.name,
        titleCN: d.name_cn,
        type: 'tv',
        bgm: {
          summary: d.summary,
          images: d.images,
          eps: d.eps,
          rating: d.rating
        }
      }))
    }));
  }

  async fetchSubject<T extends BaseBangumi>(
    bgm: T
  ): Promise<T & ExtendBangumiSubject> {
    const subject = await this.fetchRawSubject(bgm.bgmId);

    return {
      ...bgm,
      titleCN: subject.name_cn,
      bgm: {
        summary: subject.summary,
        images: subject.images,
        eps: subject.total_episodes,
        rating: subject.rating,
        subject: {
          infobox: subject.infobox,
          tags: subject.tags
        }
      }
    };
  }
}
