<script setup lang="ts">
import { onUnmounted, ref, toRefs, watch } from 'vue';

import Plyr, { SourceInfo, Options } from 'plyr';
import 'plyr/dist/plyr.css';

const emit = defineEmits<{
  (e: 'timeupdate', time: number): void;
}>();

const props = defineProps<{
  source: SourceInfo;
  options?: Options;
  start?: number;
}>();
const { source, options, start } = toRefs(props);

const container = ref<HTMLElement>();
const isReady = ref(false);
const player = ref<Plyr | null>(null);

const portTarget = ref<HTMLElement>();

const [isFull, toggleFull] = useToggle(false);
const expandFullscreen = () => {
  if (container.value) {
    const video = container.value.querySelector('video');
    if (video) {
      toggleFull();
    }
    if (player.value && player.value.fullscreen.active) {
      player.value.fullscreen.exit();
    }
  }
};

watch(container, (container) => {
  if (container) {
    const video = container.querySelector('video');
    if (video) {
      const isDesktop = window.outerWidth > 1280;
      const controls: string[] = [
        'play-large', // The large play button in the center
        'play', // Play/pause playback
        'progress', // The progress bar and scrubber for playback and buffering
        'current-time', // The current time of playback
        'duration', // The full duration of the media
        isDesktop ? 'mute' : undefined, // Toggle mute
        isDesktop ? 'volume' : undefined, // Volume control
        isDesktop ? 'settings' : undefined, // Settings menu
        'pip', // Picture-in-picture (currently Safari only)
        'airplay', // Airplay (currently Safari only)
        'download', // Show a download button with a link to either the current source or a custom URL you specify in your options
        'fullscreen' // Toggle fullscreen
      ].filter(Boolean) as string[];

      const plyrOptions: Options = {
        controls,
        keyboard: {
          focused: false,
          global: true
        },
        ...options?.value
      };
      player.value = new Plyr(video, plyrOptions);
      player.value.source = source.value;

      {
        // Use source title to check whether source was changed
        let lastTitle: string | undefined = undefined;
        player.value.on('playing', () => {
          if (lastTitle !== source.value.title && player.value) {
            if (start && start.value) {
              player.value.currentTime = start.value;
              lastTitle = source.value.title;
            } else {
              emit('timeupdate', Math.floor(player.value.currentTime));
            }
          }
        });
      }

      player.value.on('canplay', () => {
        isReady.value = true;
      });
      player.value.on('timeupdate', () => {
        if (player.value) {
          emit('timeupdate', Math.floor(player.value.currentTime));
        }
      });

      if (isDesktop) {
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
  }
});

const doc = ref<Document>();
onMounted(() => (doc.value = document));
useEventListener(doc, 'keydown', (e: KeyboardEvent) => {
  if (player.value) {
    if (e.key === ' ') {
      e.preventDefault();
      player.value.togglePlay();
    } else if (e.key === 'Escape') {
      if (isFull.value) {
        toggleFull();
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
    v-show="isReady"
    :class="[
      isFull
        ? 'fixed top-safe left-0 w-[100vw] h-[100vh] z-100'
        : 'w-full h-full'
    ]"
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
  --plyr-color-main: #00ccaa;
}
</style>
