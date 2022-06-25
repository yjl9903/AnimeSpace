<script setup lang="ts">
import { getBgmTitle } from '~/composables/bangumi';

import { useAnimeInfo } from './context';

const { bgmData, subject, onair } = useAnimeInfo();
</script>

<template>
  <div v-if="bgmData">
    <h2 font-bold text-xl mb4 pb4 border="b-1 base">
      <span>{{ getBgmTitle(bgmData) }}</span>
    </h2>
    <div v-if="subject">
      <div flex="~ gap8" lt-md:flex-col lt-md:items-center>
        <div>
          {{ subject.summary }}
        </div>
        <div flex-auto></div>
        <img :src="subject.images.large" alt="" w="240px" rounded-2 />
      </div>
    </div>
    <div v-if="onair" mt4>
      <h3 font-bold text-xl mb4>选集播放</h3>
      <ChooseEpisodes :anime="onair"></ChooseEpisodes>
    </div>
  </div>
</template>
