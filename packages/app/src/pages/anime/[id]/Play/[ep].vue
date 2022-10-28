<script lang="ts">
export default {
  name: 'PlayEP'
};
</script>

<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router';

import { useHistory } from '~/composables/client';

import { useAnimeInfo } from '../context';

const router = useRouter();

const { bgm, onair, id, ep, title } = useAnimeInfo();

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
  () => [id.value, ep.value] as [string, string],
  ([id, ep]) => {
    start.value = history.findHistory(id, +ep)?.progress ?? 0;
  }
);

let startTime = start.value ?? -1;
const playTime = ref(startTime);

useIntervalFn(() => {
  if (playTime.value >= 0) {
    history.append(id.value, +ep.value, playTime.value);
  }
}, 1000);

useIntervalFn(async () => {
  if (startTime !== playTime.value) {
    startTime = playTime.value;
    await history.syncHistory();
  }
}, 60 * 1000);

onBeforeRouteLeave(async () => {
  if (startTime !== playTime.value) {
    await history.syncHistory();
  }
});
</script>

<route>
{
  name: "AnimePlayEP",
  meta: {
    usePathKey: true
  }
}
</route>

<template>
  <div v-if="bgm">
    <h2 id="play-ep-title" font-bold text-3xl mb4 pb4 border="b-1 base">
      <router-link
        :to="`/anime/${id}`"
        class="text-$light-1 hover:text-$c-brand"
        >{{ title }}</router-link
      >
      <Playing ml1></Playing>
    </h2>
    <div flex="~ gap4 xl:gap8 lt-lg:col" w="lt-lg:full">
      <div lt-lg="mx--8">
        <div aspect="video" mt="4" w="full">
          <Player
            v-if="src"
            :options="{}"
            :source="{
              title: `${title} - E${ep}`,
              type: 'video',
              sources: [{ src: src, type: 'video/mp4', size: 1080 }]
            }"
            :start="start"
            class="w-[640px] h-[360px]"
            @timeupdate="(t: number) => (playTime = t)"
          >
            <video controls playsinline crossorigin="anonymous"></video>
          </Player>
        </div>
      </div>
      <div flex-auto></div>
      <div v-if="onair" mt4 w="xl:400px lg:280px" shadow-box rounded-2 p4>
        <h3
          font-bold
          text-xl
          mb4
          pb4
          border="b-1 base"
          flex="~ gap1"
          items-center
        >
          <span i-carbon-play-filled class="text-[#0ca]"></span
          ><span>选集播放</span>
        </h3>
        <ChooseEpisodes :anime="onair" :active="+ep"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
