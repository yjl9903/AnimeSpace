<script setup lang="ts">
import type { OnairAnime } from '~/composables/client';

defineProps<{ anime: OnairAnime }>();
</script>

<template>
  <router-link
    v-if="anime.episodes && anime.episodes.length > 0"
    :to="`/anime/${anime.bgmId}/play`"
    ><slot></slot
  ></router-link>
  <a v-else :href="anime.link"><slot></slot></a>
</template>
