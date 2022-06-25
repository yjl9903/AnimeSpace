import type { Item } from 'bangumi-data';

// @ts-ignore
import { bangumiItems } from '~bangumi/data';

import type { OverviewSubject, Subject } from './types';

import axios from 'axios';
import { defineStore } from 'pinia';
import { differenceInHours } from 'date-fns';
import { getBgmId } from './utils';

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

export const useBangumi = defineStore('bangumi', () => {
  const api = axios.create({
    baseURL: 'https://api.bgm.tv/'
  });

  const calendarLastUpdatime = useLocalStorage(
    'bangumi:calendar-update',
    new Date(0)
  );

  const data = ref<Item[]>(bangumiItems);
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
        calendarLastUpdatime.value = new Date();
      }
    });
  }

  importAll().then((items) => {
    data.value.splice(0);
    data.value.push(...items);
  });

  return {
    calendar,
    data,
    bgmIdMap,
    async subject(bgmId: string | number) {
      if (subjectMap.value.get(String(bgmId))) {
        return subjectMap.value.get(String(bgmId));
      }
      const { data } = await api.get<Subject>(`/v0/subjects/${bgmId}`);
      subjectMap.value.set(String(bgmId), data);
      return data;
    }
  };
});

async function importAll(): Promise<Item[]> {
  const resp = await axios.get(
    'https://unpkg.com/bangumi-data@0/dist/data.json'
  );
  return resp.data.items;
}
