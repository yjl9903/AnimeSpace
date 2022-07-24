<script setup lang="ts">
import { getBgmId, Subject } from '~/composables/bangumi';

import IndexGrid from './components/IndexGrid.vue';

const bangumi = useBangumi();

const pageSize = 20;
const bgms = ref([] as (Subject | undefined)[]);

const grid = ref<HTMLElement | null>(null);

const pushMore = async () => {
  const start = bgms.value.length;
  const current = [];
  for (const item of bangumi.data.slice(start, start + pageSize)) {
    const id = getBgmId(item);
    if (!id) {
      current.push(undefined);
    } else {
      const sub = await bangumi.subject(id);
      current.push(sub);
    }
  }
  bgms.value.push(...current);
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
      :bangumis="(bgms.filter(Boolean) as Subject[])"
    ></IndexGrid>
  </div>
</template>
