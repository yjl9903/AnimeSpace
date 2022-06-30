import { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { useLocalStorage, useUrlSearchParams } from '@vueuse/core';

import { PUBLIC } from '~build/meta';

import type { OnairAnime, OnairEpisode } from './types';

import { UserClient } from './user';

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
          if (err instanceof AxiosError && err?.response?.status === 401) {
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

function rand(l: number, r: number): number {
  return l + Math.round(Math.random() * (r - l));
}

const character_table = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomString(length = 32): string {
  return Array.apply(null, Array(length))
    .map(() => character_table[rand(0, character_table.length - 1)])
    .join('');
}
