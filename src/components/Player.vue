<script setup lang="ts">
import { onUnmounted, ref, toRefs, watch } from 'vue';

import Plyr, { SourceInfo, Options } from 'plyr';
import 'plyr/dist/plyr.css';

const props = defineProps<{ source: SourceInfo; options?: Options }>();
const { source, options } = toRefs(props);

const container = ref<HTMLElement>();
const player = ref<Plyr | null>(null);

const portTarget = ref<HTMLElement>();

const [isFull, toggleFull] = useToggle(false);
const expandFullscreen = () => {
  if (container.value) {
    const video = container.value.querySelector('video');
    if (video) {
      toggleFull();
    }
  }
};

watch(container, (container) => {
  if (container) {
    const video = container.querySelector('video');
    if (video) {
      const plyrOptions: Options = {
        controls: [
          'play-large', // The large play button in the center
          'play', // Play/pause playback
          'progress', // The progress bar and scrubber for playback and buffering
          'current-time', // The current time of playback
          'duration', // The full duration of the media
          'mute', // Toggle mute
          'volume', // Volume control
          'settings', // Settings menu
          'pip', // Picture-in-picture (currently Safari only)
          'airplay', // Airplay (currently Safari only)
          'download', // Show a download button with a link to either the current source or a custom URL you specify in your options
          'fullscreen' // Toggle fullscreen
        ],
        ...options?.value
      };
      player.value = new Plyr(video, plyrOptions);
      player.value.source = source.value;

      const fullscreen = document.querySelector(
        '.plyr__controls [data-plyr="fullscreen"]'
      );
      if (fullscreen) {
        const btn = document.createElement('button');
        btn.setAttribute('class', 'plyr__controls__item plyr__control');
        btn.setAttribute('type', 'button');
        btn.addEventListener('click', () => {
          expandFullscreen();
        });
        fullscreen.parentElement!.insertBefore(btn, fullscreen);
        portTarget.value = btn;
      } else {
        console.warn('Register window fullscreen fail');
      }
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
  <div
    ref="container"
    :class="[isFull && 'fixed top-0 left-0 w-[100vw] h-[100vh] z-100']"
  >
    <slot></slot>
  </div>
  <teleport v-if="portTarget" :to="portTarget">
    <span i-carbon-fit-to-width font-bold style="scale: 1.5"></span>
  </teleport>
</template>

<style>
.plyr {
  @apply h-full w-full;
}
</style>
