import axios from 'axios';
import { defineStore } from 'pinia';
import { useLocalStorage, useUrlSearchParams } from '@vueuse/core';

import { PUBLIC } from '~build/meta';

import type { HistoryLog, OnairAnime, OnairEpisode } from './types';

import { UserClient } from './user';
import { randomString } from './utils';

export type { OnairAnime, OnairEpisode };

export { UserClient };

export const useClient = defineStore('client', () => {
  const query = useUrlSearchParams('history');
  // query token -> '' (private mode) / random string (public mode)
  const initToken =
    typeof query.token === 'string'
      ? query.token
      : !PUBLIC
      ? ''
      : randomString();
  const token = ref(useLocalStorage('animepaste:token', initToken));

  const client = computed(() =>
    Boolean(token.value) ? new UserClient(token.value) : undefined
  );

  const onair = ref(useLocalStorage('animepaste:onair', [] as OnairAnime[]));

  const onairMap = computed(() => {
    const map = new Map<string, OnairAnime>();
    for (const anime of onair.value) {
      map.set(anime.bgmId, anime);
    }
    return map;
  });

  watch(
    client,
    async (client) => {
      if (client) {
        try {
          const result = await client.fetchOnair();
          onair.value.splice(0, onair.value.length, ...result);
        } catch (err) {
          if (axios.isAxiosError(err) && err?.response?.status === 401) {
            token.value = '';
          }
        }
      }
    },
    { immediate: true }
  );

  return {
    token,
    client,
    onair,
    onairMap
  };
});

export const useHistory = defineStore('history', () => {
  const clientStore = useClient();

  const history = ref(useLocalStorage('history:log', [] as HistoryLog[]));
  const historyMap = ref(new Map<string, Map<number, HistoryLog>>());

  const appendLog = (log: HistoryLog) => {
    const { bgmId, ep, progress, timestamp } = log;
    const map = historyMap.value;
    if (!map.has(bgmId)) {
      map.set(bgmId, new Map());
    }
    const submap = map.get(bgmId)!;
    if (submap.has(ep)) {
      const log = submap.get(ep)!;
      if (new Date(timestamp).getTime() >= new Date(log.timestamp).getTime()) {
        log.progress = progress;
        log.timestamp = timestamp;
      }
      return false;
    } else {
      submap.set(ep, log);
      return true;
    }
  };

  const append = (bgmId: string, ep: number, progress: number) => {
    const log = {
      bgmId,
      ep,
      progress,
      timestamp: new Date().toISOString()
    };
    const flag = appendLog(log);
    if (flag) {
      history.value.push(log);
    }
  };

  for (const item of history.value) {
    appendLog(item);
  }

  watch(
    () => clientStore.client,
    (client) => {
      // merge server history logs
    }
  );

  return {
    rawHistory: history,
    historyMap,
    history: computed(() =>
      history.value.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      })
    ),
    append,
    findHistory(bgmId: string, ep: number) {
      return historyMap.value.get(bgmId)?.get(ep);
    }
  };
});
