<script setup lang="ts">
import { useHead } from '@vueuse/head';
import { getBgmTitle } from '~/composables/bangumi';

const route = useRoute();
const { id } = toRefs<{ id: string }>(reactive(route.params as any));

const bangumi = useBangumi();

const bgmData = computed(() => {
  return bangumi.bgmIdMap.get(id.value);
});

const subject = computedAsync(async () => {
  return await bangumi.subject(id.value);
});

useHead({
  title: computed(() => {
    if (bgmData.value) {
      return bgmData.value
        ? `${getBgmTitle(bgmData.value)} - Anime Paste`
        : 'Anime Paste';
    } else {
      return 'Anime Paste';
    }
  })
});
</script>

<template>
  <div v-if="bgmData">
    <h2 font-bold text-xl mb4 pb4 border="b-1 base">
      <span>{{ getBgmTitle(bgmData) }}</span>
    </h2>
    <div v-if="subject">
      <div flex="~ gap8">
        <div>
          {{ subject.summary }}
        </div>
        <div flex-auto></div>
        <img :src="subject.images.large" alt="" w="200px" />
      </div>
    </div>
  </div>
</template>
