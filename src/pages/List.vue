<script setup lang="ts">
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
    title: "所有番剧"
  }
}
</route>

<template>
  <div text-2xl font-bold>
    <h2><span i-carbon-list></span> 所有番剧</h2>
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
              :srcset="ensureHTTPS(subjects[idx].value.images.medium)"
              media="(max-width: 767.9px)"
            />
            <img
              :src="ensureHTTPS(subjects[idx].value.images.large)"
              :alt="subjects[idx].value.name_cn"
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
          <router-link :to="'/anime/' + anime.bgmId"
            >{{ anime.title }}<Playing ml1></Playing>
          </router-link>
          <div flex-auto></div>
          <div ml2 lt-md:hidden>
            <router-link
              :to="`/anime/${anime.bgmId}/play`"
              text-3xl
              text-green-500
              i-carbon-play-filled
              rounded-full
              cursor-pointer
              border="1 base"
            ></router-link>
          </div>
        </h3>
        <div v-if="subjects[idx].value" mt4 text-sm text-gray-500:80>
          <span>{{ subjects[idx].value.eps }} 话</span>
          <span mx2 select-none>/</span>
          <span>{{ formatDate(subjects[idx].value.date) }}</span>
        </div>
        <div md:hidden mt4>
          <router-link
            :to="`/anime/${anime.bgmId}/play`"
            cursor-pointer
            text-2xl
            text-green-500
            i-carbon-play-filled
            rounded-full
            border="1 base"
          ></router-link>
        </div>
        <ChooseEpisodes lt-md:hidden mt4 :anime="anime"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
