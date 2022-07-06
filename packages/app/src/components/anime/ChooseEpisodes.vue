<script setup lang="ts">
import type { OnairAnime } from '~/composables/client';

const props = defineProps<{ anime: OnairAnime; active?: number }>();
const { active, anime } = toRefs(props);
</script>

<template>
  <div v-if="anime.episodes.length > 0" flex="~ gap4 wrap">
    <Episode
      v-for="ep in anime.episodes"
      :key="ep.ep"
      :bgm-id="anime.bgmId"
      :ep="ep.ep"
      :active="active"
    ></Episode>
  </div>
</template>
