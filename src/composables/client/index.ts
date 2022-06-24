import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

import type { OnairAnime, OnairEpisode } from './types';
import { UserClient } from './user';

export { UserClient, OnairAnime, OnairEpisode };

export const useClient = defineStore('client', () => {
  const token = useLocalStorage('animepaste:token', ref(''));

  const client = computed(() =>
    Boolean(token.value) ? new UserClient(token.value) : undefined
  );

  const onair = ref([] as OnairAnime[]);
  watch(client, async (client) => {
    if (client) {
      try {
        const result = await client.fetchOnair();
        onair.value.splice(0);
        onair.value.push(...result);
      } catch {
        token.value = '';
      }
    }
  });

  return {
    token,
    client,
    onair
  };
});
