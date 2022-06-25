<script setup lang="ts">
import { onUnmounted, ref, toRefs, watch } from 'vue';

import Plyr, { SourceInfo, Options } from 'plyr';
import 'plyr/dist/plyr.css';

const props = defineProps<{ source: SourceInfo; options?: Options }>();
const { source, options } = toRefs(props);

const container = ref<HTMLElement>();
const player = ref<Plyr | null>(null);

watch(container, (container) => {
  if (container) {
    const video = container.querySelector('video');
    if (video) {
      player.value = new Plyr(video, options?.value);
      player.value.source = source.value;
    }
  }
});

watch(source, (source) => {
  if (player.value) {
    player.value.source = source;
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
