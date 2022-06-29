<script setup lang="ts">
import type { OnairAnime } from '~/composables/client';

const props = defineProps<{ anime: OnairAnime; active?: number }>();
const { active, anime } = toRefs(props);
</script>

<template>
  <div v-if="anime.episodes.length > 0" flex="~ gap4 wrap">
    <router-link
      v-for="ep in anime.episodes"
      :key="ep.ep"
      :to="{
        path: `/anime/${anime.bgmId}/play/${ep.ep}`
      }"
      inline-block
      w-18
      text-center
      text-base
      text-sm
      op70
      hover="bg-[#fff0ec] text-[#e50914]"
      px2
      py1
      border="1 base rounded"
      :class="[ep.ep === active && 'bg-[#fff0ec] text-[#e50914]']"
    >
      第 {{ ep.ep }} 话
    </router-link>
  </div>
</template>
