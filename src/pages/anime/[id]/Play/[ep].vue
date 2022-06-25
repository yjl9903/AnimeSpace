<script setup lang="ts">
import { useAnimeInfo } from '../context';

const { subject, onair, ep } = useAnimeInfo();

const src = computed(() => {
  if (onair.value && ep.value) {
    return onair.value.episodes.find((item) => item.ep === +ep.value)?.playURL;
  }
});
</script>

<template>
  <div v-if="subject">
    <h2 font-bold text-xl mb4 pb4 border="b-1 base">
      <span>{{ subject.name_cn }} 第 {{ ep }} 话</span>
    </h2>
    <div flex="~ gap8" lt-md:flex-col justify-center>
      <Player
        v-if="src"
        :src="src"
        :options="{}"
        :source="{
          type: 'video',
          sources: [{ src: src, type: 'video/mp4', size: 1080 }]
        }"
        mt="4"
        w="full"
        aspect="video"
        aspect-video
      >
        <video controls playsinline crossorigin="anonymous"></video>
      </Player>
      <div v-if="onair" mt4 md:max-w="30%">
        <h3 font-bold text-xl mb4>选集播放</h3>
        <ChooseEpisodes :anime="onair" :active="+ep"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
