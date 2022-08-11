<script setup lang="ts">
import { format } from 'date-fns';

import { ensureHTTPS } from '~/composables';

import { useAnimeInfo } from './context';
import RatingStar from './components/RatingStar.vue';

const { title, bgm, onair } = useAnimeInfo();

const maxEps = computed(() => {
  if (onair.value) {
    return onair.value.episodes.length > 0
      ? Math.max(...onair.value.episodes.map((ep) => ep.ep))
      : 0;
  }
});

const shouldeFilterInfo = new Set([
  '中文名',
  '别名',
  '话数',
  '放送开始',
  '放送星期',
  '播放电视台',
  '其他电视台',
  '播放结束',
  'Copyright'
]);
// const filterInfo = (info: InfoBox) => !shouldeFilterInfo.has(info.key);
</script>

<route>
{
  name: "AnimeIndex",
  meta: {
    usePathKey: true
  }
}
</route>

<template>
  <div v-if="bgm">
    <h2 font-bold text-3xl mb4 pb4 flex="~ lt-md:col">
      <div>
        <router-link
          :to="`/anime/${bgm.bgmId}`"
          class="text-$light-1 hover:text-$c-brand"
          >{{ title }}</router-link
        >
        <Playing v-if="onair" ml1></Playing>
      </div>
      <div flex-auto></div>
      <RatingStar
        v-if="bgm.bgm && bgm.bgm?.rating.score !== undefined"
        min-w="180px"
        :bgm-id="bgm.bgmId"
        :rating="bgm.bgm.rating.score"
      ></RatingStar>
    </h2>
    <div v-if="bgm.bgm">
      <div flex="~ gap4" lt-lg="flex-col items-center gap4">
        <img
          :src="ensureHTTPS(bgm.bgm.images.large)"
          :alt="`Image of ${title}`"
          w="240px"
          min-h="16px"
          rounded-2
          lt-lg="mt8"
        />
        <div flex-auto max-w="16px"></div>
        <div>
          <div
            flex="~ gap2"
            lg="mt4 mb8"
            lt-lg="mb4 text-xs"
            text-sm
            font-light
          >
            <span
              >{{ format(new Date(bgm.begin), 'yyyy 年 M 月 d 日开播') }}
            </span>
            <span select-none>/</span>
            <span>{{ format(new Date(bgm.begin), 'EEEE') }} </span>
            <span select-none>/</span>
            <span>共 {{ bgm.bgm.eps ?? '?' }} 话</span>
            <span v-if="maxEps" select-none>/</span>
            <span v-if="maxEps">更新至第 {{ maxEps }} 话</span>
          </div>
          <div leading-8>
            {{ bgm.bgm.summary }}
          </div>
        </div>
      </div>
    </div>
    <!-- <div v-if="subject" mt12>
      <div v-for="info in subject.infobox.filter(filterInfo)">
        <span>{{ info.key }} : {{ info.value }}</span>
      </div>
    </div> -->
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
        ><span>播放列表</span>
      </h3>
      <ChooseEpisodes :anime="onair"></ChooseEpisodes>
    </div>
  </div>
</template>
