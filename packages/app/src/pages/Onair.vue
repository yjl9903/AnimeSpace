<script setup lang="ts">
import { format } from 'date-fns';

import { ensureHTTPS } from '~/composables';

const { onair } = useClient();

const bangumi = useBangumi();

const subjects = onair.map((onair) =>
  computedAsync(() => bangumi.subject(onair.bgmId))
);

const formatDate = (d: string) => {
  const match = /(\d+)-(\d+)-(\d+)/.exec(d)!;
  return `${match[1]} 年 ${+match[2]} 月 ${+match[3]} 日`;
};
</script>

<route>
{
  meta: {
    title: "正在播出"
  }
}
</route>

<template>
  <div text-2xl font-bold>
    <h2>
      <span i-carbon-earth-southeast-asia-filled class="text-[#0ca]"></span>
      正在播出
    </h2>
  </div>
  <div divide-y>
    <div
      v-for="(anime, idx) in onair"
      :key="anime.bgmId"
      py8
      flex="~ md:gap8 lt-md:gap4 initial"
      border-base
    >
      <div v-if="subjects[idx].value" inline-block>
        <router-link
          :to="`/anime/` + anime.bgmId"
          inline-block
          w="md:200px lt-md:100px"
          max-w="md:200px lt-md:100px"
        >
          <picture w="full" max-w="full">
            <source
              :srcset="ensureHTTPS(subjects[idx].value!.bgm.images.medium)"
              media="(max-width: 767.9px)"
            />
            <img
              :src="ensureHTTPS(subjects[idx].value!.bgm.images.large)"
              :alt="subjects[idx].value!.titleCN"
              w="full"
              max-w="full"
              object-contain
              rounded-2
            />
          </picture>
        </router-link>
      </div>
      <div inline-block flex="grow">
        <h3 font-bold text-xl flex="~" items-center w-full>
          <router-link
            :to="'/anime/' + anime.bgmId"
            class="text-$light-1 hover:text-$c-brand"
            >{{
              subjects[idx].value ? subjects[idx].value?.titleCN : anime.title
            }}<Playing ml1></Playing>
          </router-link>
          <div flex-auto></div>
          <div ml2 lt-md:hidden>
            <PlayBangumi
              :anime="anime"
              text-3xl
              text-green-500
              i-carbon-play-filled
              rounded-full
              cursor-pointer
              border="1 base"
            ></PlayBangumi>
          </div>
        </h3>
        <div v-if="subjects[idx].value" mt4 text-sm text-gray-500:80>
          <span>{{ formatDate(subjects[idx].value!.begin) }}</span>
          <span mx2 select-none>/</span>
          <span
            >{{ format(new Date(subjects[idx].value!.begin), 'EEEE') }}
          </span>
          <span mx2 select-none>/</span>
          <span
            >共
            {{ subjects[idx].value!.bgm.eps ?? '?' }}
            话</span
          >
        </div>
        <div md:hidden mt4>
          <PlayBangumi
            :anime="anime"
            cursor-pointer
            text-2xl
            text-green-500
            i-carbon-play-filled
            rounded-full
            border="1 base"
          ></PlayBangumi>
        </div>
        <div lt-xl:hidden mt4 text-sm leading-6>
          {{ subjects[idx].value?.bgm.summary }}
        </div>
        <div
          v-if="anime.episodes.length > 0"
          lt-md:hidden
          mt8
          border="1 base"
          p4
          rounded-2
          shadow-box
        >
          <h3 font-bold pb2 mb3 border="b-1 base" flex="~" items-center>
            <span i-carbon-play-filled mr1 class="text-[#0ca]"></span>播放列表
          </h3>
          <ChooseEpisodes :anime="anime"></ChooseEpisodes>
        </div>
      </div>
    </div>
    <div v-if="onair.length === 0" py8>
      <p text-center text-base font-light>没有番剧正在播出...</p>
    </div>
  </div>
</template>
