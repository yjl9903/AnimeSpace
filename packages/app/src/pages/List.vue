<script setup lang="ts">
import { getBgmId, Subject } from '~/composables/bangumi';

import IndexGrid from './components/IndexGrid.vue';

const bangumi = useBangumi();

const pageSize = 20;
const maxNum = useSessionStorage('page-list:maxNum', pageSize);
const bgms = ref([] as (Subject | undefined)[]);

watch(
  () => maxNum.value,
  async (maxNum) => {
    let i = 0;
    for (const item of bangumi.data.slice(0, maxNum)) {
      const id = getBgmId(item);
      if (!id) continue;
      if (i < bgms.value.length && id === String(bgms.value[i]?.id)) {
        i++;
        continue;
      }
      const sub = await bangumi.subject(id);
      bgms.value.push(sub);
    }
  },
  {
    immediate: true
  }
);

const placeholder = ref<HTMLElement | null>(null);
useIntersectionObserver(placeholder, ([{ isIntersecting }]) => {
  if (isIntersecting && bgms.value.length >= maxNum.value) {
    maxNum.value = maxNum.value + pageSize;
  }
});
</script>

<route>
{
  meta: {
    title: "所有番剧"
  }
}
</route>

<template>
  <div text-2xl font-bold>
    <h2><span i-carbon-list></span> 所有番剧</h2>
  </div>
  <div px0 py8 relative>
    <IndexGrid
      :bangumis="(bgms.slice(0, maxNum).filter(Boolean) as Subject[])"
    ></IndexGrid>
    <div ref="placeholder"></div>
  </div>
</template>
