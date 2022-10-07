<script setup lang="ts">
import type { Ref } from 'vue';

import { differenceInHours, format } from 'date-fns';

import IndexGrid from './components/IndexGrid.vue';
import { Bangumi, SubjectBangumi } from '~/composables/types';

const now = new Date();
const weekday = now.getDay();
const weekDayLocale = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const weekdayRefs: Ref<HTMLElement | undefined>[] = [
  ref(undefined),
  ref(undefined),
  ref(undefined),
  ref(undefined),
  ref(undefined),
  ref(undefined),
  ref(undefined)
];
const { y: scrollY } = useWindowScroll();
const { height } = useWindowSize();
const isActive = ref(0);
watch(scrollY, () => {
  for (let i = 0; i < weekdayRefs.length; i++) {
    const day = weekdayRefs[i];
    if (day.value) {
      const rect = day.value.getBoundingClientRect();
      if (0 <= rect.top && rect.top < height.value) {
        isActive.value = i;
        break;
      }
    }
  }
});

onMounted(async () => {
  const ScrollReveal = (await import('scrollreveal')).default;
  ScrollReveal().reveal('.anime-card');
});

const client = useClient();
const bangumi = useBangumi();

// TODO: config from user
const hiddenBgm = new Set(['899', '975']);

const isOnair = (bgm: Bangumi) => {
  return client.onairMap.has(bgm.bgmId);
};

const sortBgm = (a: Bangumi, b: Bangumi) => {
  const x = isOnair(a) ? 0 : 1;
  const y = isOnair(b) ? 0 : 1;
  if (x === y) {
    return a.begin.localeCompare(b.begin);
  } else {
    return x - y;
  }
};

const latestBangumis = computedAsync(() => {
  return Promise.all(
    client.onair
      .filter((onair) => {
        const latestUpdate = onair.episodes.reduce(
          (mx, ep) => Math.max(mx, new Date(ep.creationTime ?? 0).getTime()),
          0
        );
        return differenceInHours(new Date(), new Date(latestUpdate)) <= 72;
      })
      .map((onair) => bangumi.subject(onair.bgmId))
      .filter(Boolean) as Promise<SubjectBangumi>[]
  );
});

const filterBgm = (bgm: Bangumi) => {
  if (hiddenBgm.has(bgm.bgmId)) return false;
  return bangumi.bgmMap.has(bgm.bgmId);
};

const calendar = computed(() =>
  bangumi.calendar.map((c) => c.filter(filterBgm).sort(sortBgm))
);
</script>

<route>
{
  meta: {
    title: "主页"
  }
}
</route>

<template>
  <ClientOnly>
    <div v-if="latestBangumis && latestBangumis.length > 0" mb8>
      <div text-2xl mb4 font-bold>
        <h2><span i-carbon-fire text-red-400></span> 最近更新</h2>
      </div>
      <div
        border="1 base"
        rounded-2
        shadow-box
        bg-gray-100:30
        md:mr14
        flex-grow
        p4
      >
        <IndexGrid :bangumis="latestBangumis" />
        <div
          mt4
          pt2
          text-right
          text-sm
          font-mono
          border="t-1 base"
          class="text-gray-500/50"
        >
          <span>最近更新于 </span>
          <span>{{ format(client.timestamp, 'yyyy-MM-dd HH:mm') }}</span>
        </div>
      </div>
    </div>

    <div text-2xl mb4 font-bold>
      <h2><span i-carbon-calendar text-blue-400></span> 番剧周历</h2>
    </div>
    <div flex="~ gap4">
      <div border="1 base" rounded-2 shadow-box bg-gray-100:30 md:mr4 flex-grow>
        <div
          v-for="offset in 7"
          :ref="(el) => (weekdayRefs[offset - 1].value = el as HTMLElement)"
          :key="offset"
          :id="`calendar-${offset}`"
          border="base"
          :class="[offset < 7 && 'border-b-1']"
          p4
        >
          <h3 mb4 flex="~" items-center>
            <span font-bold text-lg>{{
              weekDayLocale[(13 - offset) % 7]
            }}</span>
          </h3>
          <IndexGrid :bangumis="calendar[(13 - offset) % 7]" />
        </div>
      </div>

      <!-- Weekday navbar -->
      <div
        style="position: sticky; top: 20vh"
        h="60vh"
        border="l-2 [rgb(0,161,214,0.8)]"
        flex="~ col"
        justify-between
        w-10
        py1
        mr="-4"
      >
        <div class="left-large-dot"></div>
        <div
          v-scroll-to="{ el: `#calendar-${offset}`, offset: -60 }"
          v-for="offset in 7"
          :class="isActive === offset - 1 && 'weekday-active'"
          hover="bg-op-40 bg-gray-200 dark:bg-gray/50"
          cursor-pointer
          ml1
          p1
          font-light
          rounded
          text-center
          text-0
        >
          <span text-xs select-none>{{
            weekDayLocale[(13 - offset) % 7]
          }}</span>
        </div>
        <div class="left-large-dot"></div>
      </div>
    </div>
  </ClientOnly>
</template>

<style>
.weekday-active {
  @apply bg-op-10 bg-[#00a1d6] dark:bg-gray/50;
}

.left-small-dot,
.left-large-dot {
  @apply pl-4 relative;
}
.left-small-dot::before {
  content: ' ';
  position: absolute;
  left: -1px;
  top: 12px;
  width: 6px;
  height: 6px;
  margin-left: -4px;
  background: rgb(0, 161, 214, 0.8);
  border-radius: 50%;
  border: 1px solid #fff;
  transition: all 0.3s ease-in-out;
}
.left-large-dot::before {
  content: ' ';
  position: absolute;
  left: 1px;
  top: 50%;
  margin-left: -6px;
  margin-top: -4px;
  width: 8px;
  height: 8px;
  background: rgb(0, 161, 214, 0.8);
  border-radius: 50%;
}
div:hover.left-small-dot::before {
  background-color: #222;
}
</style>
