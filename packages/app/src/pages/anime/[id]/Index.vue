<script setup lang="ts">
import { format } from 'date-fns';

import { ensureHTTPS } from '~/composables';
import { getBgmTitle, getBgmId } from '~/composables/bangumi';

import { useAnimeInfo } from './context';
import RatingStar from './components/RatingStar.vue';

const { bgmData, subject, onair } = useAnimeInfo();

const maxEps = computed(() => {
  if (onair.value) {
    return onair.value.episodes.length > 0
      ? Math.max(...onair.value.episodes.map((ep) => ep.ep))
      : 0;
  }
});
</script>

<template>
  <div v-if="bgmData">
    <h2 font-bold text-3xl mb4 pb4 flex="~">
      <div>
        <router-link
          :to="`/anime/${getBgmId(bgmData)}`"
          class="text-$light-1 hover:text-$c-brand"
          >{{ getBgmTitle(bgmData) }}</router-link
        >
        <Playing v-if="onair" ml1></Playing>
      </div>
      <div flex-auto></div>
      <RatingStar
        v-if="subject?.rating.score !== undefined"
        min-w="180px"
        :rating="subject?.rating.score"
      ></RatingStar>
    </h2>
    <div v-if="subject">
      <div flex="~ gap4" lt-lg="flex-col items-center gap4">
        <img
          :src="ensureHTTPS(subject.images.large)"
          :alt="`Image of ${subject.name_cn}`"
          w="240px"
          rounded-2
          lt-lg="mt8"
        />
        <div flex-auto max-w="16px"></div>
        <div>
          <div flex="~ gap2" lg="mt4 mb8" lt-lg="mb4" text-sm font-light>
            <span
              >{{ format(new Date(subject.date), 'yyyy 年 M 月 d 日开播') }}
            </span>
            <span>/</span>
            <span>共 {{ subject.eps }} 话</span>
            <span v-if="maxEps">/</span>
            <span v-if="maxEps">更新至第 {{ maxEps }} 话</span>
          </div>
          <div leading-8>
            {{ subject.summary }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="onair && onair.episodes.length > 0" mt12 shadow-box rounded-2 p8>
      <h3
        font-bold
        text-xl
        pb4
        mb4
        border="b-1 base"
        flex="~ gap1"
        items-center
      >
        <span i-carbon-play-filled class="text-[#0ca]"></span
        ><span>选集播放</span>
      </h3>
      <ChooseEpisodes :anime="onair"></ChooseEpisodes>
    </div>
  </div>
</template>
