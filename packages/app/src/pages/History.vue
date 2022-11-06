<script setup lang="ts">
import { format } from 'date-fns';

import { useHistory } from '~/composables/client';

const history = useHistory();
const bangumi = useBangumi();
</script>

<route>
{
  meta: {
    title: "观看历史"
  }
}
</route>

<template>
  <div text-2xl mb4 font-bold>
    <h2><span i-carbon-recently-viewed></span> 观看历史</h2>
  </div>
  <div border="l-2 base dashed" divide-y pl4>
    <div
      v-for="log in history.history"
      :key="`${log.bgmId}:${log.ep}`"
      flex="~ gap2"
      border="base"
      items-center
      py2
    >
      <router-link :to="`/anime/${log.bgmId}/play/${log.ep}`">
        <span v-if="bangumi.useBgm(log.bgmId).value"
          >{{ getCnTitle(bangumi.useBgm(log.bgmId).value!) }}
        </span>
      </router-link>
      <Episode :bgm-id="log.bgmId" :ep="log.ep" p1></Episode>
      <span flex-auto></span>
      <span text-gray-500:80 font-mono>{{
        format(new Date(log.timestamp), 'M-dd hh:mm')
      }}</span>
    </div>
  </div>
</template>
