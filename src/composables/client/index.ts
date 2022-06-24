import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

import type { OnairAnime, OnairEpisode } from './types';
import { UserClient } from './user';

export { UserClient, OnairAnime, OnairEpisode };

export const useClient = defineStore('client', () => {
  const token = ref(useStorage('animepaste:token', ''));

  const client = computed(() =>
    Boolean(token.value) ? new UserClient(token.value) : undefined
  );

  const onair = ref(useStorage('animepaste:onair', [] as OnairAnime[]));

  watch(
    client,
    async (client) => {
      if (client) {
        try {
          const result = await client.fetchOnair();
          console.log(toRaw(onair.value));
          console.log(result);
          onair.value.splice(0);
          onair.value.push(...result);
        } catch {
          token.value = '';
        }
      }
    },
    { immediate: true }
  );

  return {
    token,
    client,
    onair
  };
});
