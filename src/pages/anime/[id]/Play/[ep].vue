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
      <span>{{ subject.name_cn }} - 第 {{ ep }} 话</span>
    </h2>
    <div flex="~ gap4 xl:gap8 lt-lg:col" w="lt-lg:full">
      <div aspect="video" mt="4" w="full">
        <Player
          v-if="src"
          :src="src"
          :options="{}"
          :source="{
            type: 'video',
            sources: [{ src: src, type: 'video/mp4', size: 1080 }]
          }"
          class="w-[640px] h-[360px]"
        >
          <video controls playsinline crossorigin="anonymous"></video>
        </Player>
      </div>
      <div flex-auto></div>
      <div v-if="onair" mt4 max-w="xl:350px lg:250px">
        <h3 font-bold text-xl mb4>选集播放</h3>
        <ChooseEpisodes :anime="onair" :active="+ep"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
