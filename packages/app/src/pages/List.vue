<script setup lang="ts">
import NProgress from 'nprogress';

import type { SubjectBangumi } from '~/composables/types';

import IndexGrid from './components/IndexGrid.vue';

onMounted(async () => {
  const ScrollReveal = (await import('scrollreveal')).default;
  ScrollReveal().reveal('.anime-card');
});

const bangumi = useBangumi();

const pageSize = 20;

const bgms = ref([] as (SubjectBangumi | undefined)[]);

const grid = ref<HTMLElement | null>(null);

const pushMore = async () => {
  if (!import.meta.env.SSR) NProgress.start();
  const start = bgms.value.length;
  const current = [];
  for (const item of bangumi.data.slice(start, start + pageSize)) {
    const id = item.bgmId;
    if (!id) {
      current.push(undefined);
    } else {
      const sub = await bangumi.subject(id);
      current.push(sub);
    }
  }
  bgms.value.push(...current);
  if (!import.meta.env.SSR) NProgress.done();
};

pushMore();

useInfiniteScroll(useDocument(), pushMore, { distance: 200 });
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
      ref="grid"
      :bangumis="(bgms.filter(Boolean) as SubjectBangumi[])"
    ></IndexGrid>
  </div>
</template>
