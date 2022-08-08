<script setup lang="ts">
import type { SubjectBangumi } from '~/composables/types';

const props = defineProps<{ bangumis: SubjectBangumi[] }>();

const { bangumis } = toRefs(props);

const client = useClient();

const isOnair = (bgm: SubjectBangumi) => {
  return client.onairMap.has(bgm.bgmId);
};

const getOnairMaxEps = (bgm: SubjectBangumi) => {
  const onair = client.onairMap.get(bgm.bgmId);
  if (onair) {
    return onair.episodes.length > 0
      ? Math.max(...onair.episodes.map((ep) => ep.ep))
      : 0;
  }
};

onMounted(async () => {
  const ScrollReveal = (await import('scrollreveal')).default;
  ScrollReveal().reveal('.anime-card');
});
</script>

<template>
  <div grid="~ flow-row gap4 xl:cols-7 lg:cols-4 md:cols-3 lt-md:cols-2">
    <div
      v-for="bgm in bangumis"
      :key="bgm.bgmId"
      w="140px lt-md:100px"
      lt-md:mb4
      class="anime-card"
    >
      <router-link tag="div" :to="'/anime/' + bgm.bgmId" w="full">
        <picture
          w="full"
          flex="~"
          items-center
          justify-center
          lt-md:justify-start
          text-0
          relative
        >
          <source
            :srcset="ensureHTTPS(bgm.bgm.images.medium)"
            media="(max-width: 767.9px)"
            rounded-2
          />
          <img
            :src="ensureHTTPS(bgm.bgm.images.large)"
            :alt="'Picture for ' + bgm.titleCN"
            object-fill
            w="full"
            h="196px lt-md:140px"
            rounded-2
            hover="shadow shadow-light-900 dark:shadow-dark-900 shadow-lg bg-transparent"
            cursor="pointer"
          />
          <Playing
            v-if="isOnair(bgm)"
            absolute
            top="-5"
            right="-2"
            color="bg-[#0ca]"
          ></Playing>
        </picture>
      </router-link>
      <router-link
        :to="`/anime/${bgm.bgmId}`"
        target="_blank"
        class="text-base hover:text-$c-brand text-sm"
        >{{ bgm.titleCN !== '' ? bgm.titleCN : bgm.title }}</router-link
      >
      <span
        v-if="isOnair(bgm) && getOnairMaxEps(bgm)"
        block
        text-xs
        font-light
        text-gray-500:80
        dark:text-gray-400
        >更新至第 {{ getOnairMaxEps(bgm) }} 话</span
      >
    </div>
  </div>
</template>
