import type { Item } from 'bangumi-data';

import axios from 'axios';
import { defineStore } from 'pinia';
import { differenceInDays, differenceInHours } from 'date-fns';

import { bangumis } from '~bangumi/data';

import type { OverviewSubject, Subject } from './types';

import { getBgmId, sleep } from './utils';

export * from './types';
export * from './utils';

interface Calender {
  weekday: {
    en: string;
    cn: string;
    ja: string;
    id: number;
  };
  items: OverviewSubject[];
}

const CacheHour = 0;
const BangumiCacheDay = 7;

export const useBangumi = defineStore('bangumi', () => {
  const api = axios.create({
    baseURL: 'https://api.bgm.tv/'
  });

  const calendarLastUpdatime = useLocalStorage(
    'bangumi:calendar-update',
    new Date(0)
  );

  const data = ref(bangumis);
  const bgmIdMap = computed(() => {
    const map = new Map<string, Item>();
    for (const bgm of data.value) {
      const id = getBgmId(bgm);
      if (id) {
        map.set(id, bgm);
      }
    }
    return map;
  });

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
  const subjectMap = ref(
    useLocalStorage('bangumi:subject', new Map<string, Subject>())
  );

  if (differenceInHours(new Date(), calendarLastUpdatime.value) >= CacheHour) {
    api.get<Calender[]>('/calendar').then(({ data }) => {
      calendar.value.splice(0);
      for (const day of data) {
        calendar.value.push(day.items);
      }
      for (let i = 0; i < 7; i++) {
        if (
          calendar.value[i].length !== data[i].items.length &&
          calendar.value[i].some((v, id) => v.id !== data[i].items[id].id)
        ) {
          calendar.value[i].splice(
            0,
            calendar.value[i].length,
            ...data[i].items
          );
        }
      }
      calendarLastUpdatime.value = new Date();
    });
  }

  importAll().then((items) => {
    if (items.length > 0) {
      data.value.splice(0, data.value.length, ...items);
    }
  });

  const subject = async (
    bgmId: string | number,
    retry = 1
  ): Promise<Subject | undefined> => {
    if (subjectMap.value.get(String(bgmId))) {
      const subject = subjectMap.value.get(String(bgmId))!;
      // Cache subject for 7 days
      if (
        subject.timestamp &&
        differenceInDays(new Date(), new Date(subject.timestamp)) <=
          BangumiCacheDay
      ) {
        return subject;
      }
    }

    try {
      const { data } = await api.get<Subject>(`/v0/subjects/${bgmId}`);
      data.timestamp = new Date();
      subjectMap.value.set(String(bgmId), data);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const { response } = err;
        if (response?.status === 404) {
          return undefined;
        }
      }
      await sleep(retry);
      return subject(bgmId, retry * 2);
    }
  };

  return {
    calendar,
    data,
    bgmIdMap,
    subject
  };
});

async function importAll(): Promise<Item[]> {
  if (import.meta.env.SSR) return [];
  try {
    const { items } = await import('bangumi-data');
    return items.sort((lhs, rhs) => {
      const d1 = new Date(lhs.begin).getTime();
      const d2 = new Date(rhs.begin).getTime();
      return d2 - d1;
    });
  } catch {
    return importAll();
  }
}
