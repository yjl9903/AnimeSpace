import axios from 'axios';

import type { Calender, Subject } from './types';

export const baseURL = 'https://api.bgm.tv';

export class Client {
  private readonly api = axios.create({
    baseURL,
    timeout: 10 * 1000
  });

  async fetchCalendar() {
    const { data } = await this.api.get<Calender[]>('/calendar');
    return data;
  }

  async fetchSubject(bgmId: string) {
    const { data } = await this.api.get<Subject>(`/v0/subjects/${bgmId}`);
    return data;
  }
}
