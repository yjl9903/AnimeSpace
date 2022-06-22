<script setup lang="ts">
import { onUnmounted, ref, toRefs, watch } from 'vue';

import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

const props = defineProps<{ options: Plyr.Options }>();
const { options } = toRefs(props);

const container = ref<HTMLElement>();
const player = ref<Plyr | null>(null);

watch(container, (container) => {
  if (container) {
    const video = container.querySelector('video');
    if (video) {
      player.value = new Plyr(video, options.value);
    }
  }
});

onUnmounted(() => {
  try {
    if (player.value) player.value.destroy();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.log(err);
    }
  }
});
</script>

<template>
  <div ref="container">
    <slot></slot>
  </div>
</template>
