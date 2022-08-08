import { defineStore } from 'pinia';
import { differenceInDays, differenceInHours } from 'date-fns';

import { BgmClient } from '@animepaste/bangumi/bgm';

import { bangumis } from '~bangumi/recent';

import type { Bangumi, SubjectBangumi } from '../types';

export * from './utils';

const CalendarCacheHour = 0;
const BangumiCacheDay = 7;

export const useBangumi = defineStore('bangumi', () => {
  const client = new BgmClient<Bangumi>();

  const calendarLastUpdatime = useLocalStorage(
    'bangumi:calendar-update',
    new Date(0)
  );

  const data = ref<Bangumi[]>(bangumis.reverse());
  const bgmMap = computed(() => {
    const map = new Map<string, Bangumi>();
    for (const bgm of data.value) {
      map.set(bgm.bgmId, bgm);
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
    ] as SubjectBangumi[][])
  );

  if (
    differenceInHours(new Date(), calendarLastUpdatime.value) >=
    CalendarCacheHour
  ) {
    // api.get<Calender[]>('/calendar').then(({ data }) => {
    //   calendar.value.splice(0);
    //   for (const day of data) {
    //     calendar.value.push(day.items);
    //   }
    //   for (let i = 0; i < 7; i++) {
    //     if (
    //       calendar.value[i].length !== data[i].items.length &&
    //       calendar.value[i].some((v, id) => v.id !== data[i].items[id].id)
    //     ) {
    //       calendar.value[i].splice(
    //         0,
    //         calendar.value[i].length,
    //         ...data[i].items
    //       );
    //     }
    //   }
    //   calendarLastUpdatime.value = new Date();
    // });

    client.fetchCalendar().then((data) => {
      for (let i = 0; i < 7; i++) {
        console.log();
        if (
          calendar.value[i].length !== data[i].bangumis.length ||
          calendar.value[i].some(
            (bgm, id) => bgm.bgmId !== data[i].bangumis[id].bgmId
          )
        ) {
          calendar.value[i].splice(
            0,
            calendar.value[i].length,
            ...data[i].bangumis
          );
        }
      }
      calendarLastUpdatime.value = new Date();
    });
  }

  if (!import.meta.env.SSR) {
    importAll().then((items) => {
      data.value.splice(0, data.value.length, ...items);
    });
  }

  const subjectMap = ref(
    useLocalStorage('bangumi:subject', new Map<string, SubjectBangumi>())
  );

  const getSubjectCache = (bgmId: string) => {
    if (subjectMap.value.get(bgmId)) {
      const subject = subjectMap.value.get(String(bgmId))!;
      // Cache subject for 7 days
      if (
        // @ts-ignore
        subject._timestamp &&
        // @ts-ignore
        differenceInDays(new Date(), new Date(subject._timestamp)) <=
          BangumiCacheDay
      ) {
        return subject;
      }
    }
  };

  const subject = async (
    bgmId: string | number
  ): Promise<SubjectBangumi | undefined> => {
    bgmId = String(bgmId);

    const cache = getSubjectCache(bgmId);
    if (cache) {
      return cache;
    }

    const bgm = bgmMap.value.get(bgmId);
    try {
      if (bgm) {
        const subject = await client.fetchSubject(bgm);
        // @ts-ignore
        subject._timestamp = new Date();
        subjectMap.value.set(bgmId, subject);
        return subject;
      } else {
        const subject = await client.fetchSubject(bgmId);
        // @ts-ignore
        subject._timestamp = new Date();
        subjectMap.value.set(bgmId, subject);
        return subject;
      }
    } catch (error) {
      return undefined;
    }
  };

  return {
    calendar,
    data,
    bgmMap,
    subjectMap,
    subject,
    useBgm(bgmId: string | number) {
      bgmId = String(bgmId);
      const sub = getSubjectCache(bgmId);
      const bgm = ref(sub ?? bgmMap.value.get(bgmId));
      if (!sub) {
        subject(bgmId).then((newBgm) => {
          if (newBgm) {
            bgm.value = newBgm;
          }
        });
      }
      return bgm;
    }
  };
});

async function importAll(): Promise<Bangumi[]> {
  try {
    const { bangumis } = await import('~bangumi/all');
    return bangumis.reverse();
  } catch {
    return importAll();
  }
}
