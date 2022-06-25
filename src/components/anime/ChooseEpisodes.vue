<script setup lang="ts">
import type { OnairAnime } from '~/composables/client';

defineProps<{ anime: OnairAnime }>();
</script>

<template>
  <div flex="~ gap4 wrap">
    <router-link
      v-for="ep in anime.episodes"
      :to="{
        path: `/anime/${anime.bgmId}/play/${ep.ep}`
      }"
      inline-block
      w-20
      text-center
      text-base
      text-sm
      op70
      hover="bg-[#fff0ec] text-[#e50914]"
      px2
      py1
      border="1 base rounded"
    >
      第 {{ ep.ep }} 话
    </router-link>
  </div>
</template>
