<script setup lang="ts">
import { useHistory } from '~/composables/client';

import { useAnimeInfo } from '../context';

const router = useRouter();

const { subject, onair, id, ep } = useAnimeInfo();

const src = computed(() => {
  if (onair.value && ep.value) {
    const findEp = onair.value.episodes.find((item) => item.ep === +ep.value);
    if (!findEp) {
      router.replace({ name: 'Index' });
      return undefined;
    } else {
      return findEp.playURL;
    }
  }
});

const history = useHistory();

const start = ref(history.findHistory(id.value, +ep.value)?.progress ?? 0);
watch(
  () => [id.value, ep.value],
  ([id, ep]) => {
    start.value = history.findHistory(id, +ep)?.progress ?? 0;
  }
);

const playTime = ref(start.value ?? 0);

useIntervalFn(() => {
  if (playTime.value) {
    history.append(id.value, +ep.value, playTime.value);
  }
}, 1000);
</script>

<template>
  <div v-if="subject">
    <h2 id="play-ep-title" font-bold text-xl mb4 pb4 border="b-1 base">
      <span>{{ subject.name_cn }} - 第 {{ ep }} 话</span>
    </h2>
    <div flex="~ gap4 xl:gap8 lt-lg:col" w="lt-lg:full">
      <div aspect="video" mt="4" w="full">
        <Player
          v-if="src"
          :options="{}"
          :source="{
            title: `${subject.name_cn} - E${ep}`,
            type: 'video',
            sources: [{ src: src, type: 'video/mp4', size: 1080 }]
          }"
          :start="start"
          class="w-[640px] h-[360px]"
          @timeupdate="(t) => (playTime = t)"
        >
          <video controls playsinline crossorigin="anonymous"></video>
        </Player>
      </div>
      <div flex-auto></div>
      <div v-if="onair" mt4 max-w="xl:350px lg:250px" min-w="250px">
        <h3 font-bold text-xl mb4>选集播放</h3>
        <ChooseEpisodes :anime="onair" :active="+ep"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
