<script setup lang="ts">
import type { OverviewSubject, Subject } from '~/composables/bangumi/types';
import { ensureHTTPS } from '~/composables';

defineProps<{ bangumis: (OverviewSubject | Subject)[] }>();

const client = useClient();

const isOnair = (subject: OverviewSubject | Subject) => {
  return client.onairMap.has(String(subject.id));
};
</script>

<template>
  <div grid="~ flow-row gap4 xl:cols-7 lg:cols-4 md:cols-3 lt-md:cols-2">
    <div
      v-for="bgm in bangumis"
      :key="bgm.id"
      w="140px lt-md:100px"
      lt-md:mb4
      class="anime-card"
    >
      <router-link tag="div" :to="'/anime/' + bgm.id" w="full">
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
            :srcset="ensureHTTPS(bgm.images.medium)"
            media="(max-width: 767.9px)"
            rounded-2
          />
          <img
            :src="ensureHTTPS(bgm.images.large)"
            :alt="'Picture for ' + bgm.name_cn"
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
        :to="`/anime/${bgm.id}`"
        target="_blank"
        class="text-base hover:text-$c-brand text-sm font-light"
        >{{ bgm.name_cn !== '' ? bgm.name_cn : bgm.name }}</router-link
      >
    </div>
    <div flex-grow></div>
  </div>
</template>
