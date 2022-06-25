import type { OverviewSubject } from './types';

import axios from 'axios';
import { defineStore } from 'pinia';
import { differenceInHours } from 'date-fns';

export * from './types';

interface Calender {
  weekday: {
    en: string;
    cn: string;
    ja: string;
    id: number;
  };
  items: OverviewSubject[];
}

const CalendarCacheHour = 2;

export const useBangumi = defineStore('bangumi', () => {
  const api = axios.create({
    baseURL: 'https://api.bgm.tv/'
  });

  const lastUpdatime = useLocalStorage('bangumi:calendar-update', new Date());

  const calendar = ref(
    useLocalStorage('bangumi:calendar', [
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ] as OverviewSubject[][])
  );

  if (differenceInHours(lastUpdatime.value, new Date()) >= CalendarCacheHour) {
    api.get<Calender[]>('/calendar').then(({ data }) => {
      calendar.value.splice(0);
      for (const day of data) {
        calendar.value.push(day.items);
        lastUpdatime.value = new Date();
      }
    });
  }

  return {
    calendar
  };
});
