<script setup lang="ts">
import { format } from 'date-fns';

import type { Subject } from '~/composables/bangumi';
import { useHistory } from '~/composables/client';

const isDark = useDark();
const toggleDark = useToggle(isDark);

const doc = ref<Document | null>(null);
onMounted(() => {
  doc.value = document;
});
const { arrivedState } = useScroll(doc);
const { top } = toRefs(arrivedState);

const history = useHistory();
const bangumi = useBangumi();

const map: Record<string, Subject> = reactive({});
watch(
  history.history,
  (history) => {
    for (const item of history) {
      if (!(item.bgmId in map)) {
        bangumi
          .subject(item.bgmId)
          .then((data) => data && (map[item.bgmId] = data));
      }
    }
  },
  { immediate: true }
);

const formatProgress = (time: number) => {
  const m = Math.floor(time / 60);
  const s = time % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};
</script>

<template>
  <div
    v-show="!top"
    class="nav-fallback"
    lt-xl="z-9 w-full h-$navbar-height fixed bg-white"
    top-safe
  ></div>
  <nav
    text-xl
    lt-md:text-lg
    z-10
    w-full
    h="$navbar-height"
    fixed
    top-safe
    flex="~ gap4 lt-md:gap2"
    items-center
    px8
    transition="all"
    duration="200"
    :class="[top || 'backdrop-filter hero']"
  >
    <h1 font-sans cursor-pointer select-none>
      <router-link to="/" class="text-base select-none"
        >Anime Paste</router-link
      >
    </h1>
    <router-link
      to="/onair"
      text-lg
      hover="bg-op-50 bg-white dark:bg-gray/50"
      px4
      py2
      lt-md:px1
      lt-md:py1
      rounded-2
    >
      <span text-base font-light select-none>放映</span>
    </router-link>
    <router-link
      to="/list"
      text-lg
      hover="bg-op-50 bg-white dark:bg-gray/50"
      px4
      py2
      lt-md:px1
      lt-md:py1
      rounded-2
    >
      <span text-base font-light select-none>番剧</span>
    </router-link>
    <div flex-auto />

    <span class="nav-btn" relative>
      <router-link
        to="/history"
        icon-btn
        i-carbon-recently-viewed
        lt-md:text-sm
        text-base
      ></router-link>
      <div
        class="nav-dropdown"
        v-if="history.history.length > 0"
        hidden
        absolute
        top="1.5rem"
        right="-20"
        w100
        pt2
        z-20
      >
        <div rounded-2 bg-base bg-op-100 border="1 base" w-full p4>
          <div text-sm pb2 mb2 font-bold border="b-1 base">
            <h2><span i-carbon-recently-viewed></span> 观看历史</h2>
          </div>
          <div border="l-2 base dashed" divide-y>
            <div
              v-for="log in history.history.slice(0, 5)"
              :key="`${log.bgmId}:${log.ep}`"
              flex="~ gap2"
              border="base"
              items-center
              text-sm
              py1
              ml2
            >
              <router-link :to="`/anime/${log.bgmId}/play/${log.ep}`">
                <span v-if="map[log.bgmId]"
                  >{{ map[log.bgmId]!.name_cn }}
                </span>
              </router-link>
              <div flex-auto></div>
              <span p1 text-2 min-w="48px">
                <router-link
                  :to="`/anime/${log.bgmId}/play/${log.ep}`"
                  text-gray
                  text-center
                  hover="text-[#0ca]"
                  ><span block h4
                    >第 <span font-mono>{{ log.ep }}</span> 话</span
                  ><span block h4>{{
                    formatProgress(log.progress)
                  }}</span></router-link
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </span>

    <span class="nav-btn" relative>
      <router-link
        to="/settings"
        icon-btn
        i-carbon-settings
        lt-md:text-sm
        text-base
      ></router-link>
      <div
        class="nav-dropdown"
        hidden
        absolute
        top="1.5rem"
        right="-10"
        w50
        h="200px"
        pt2
        z-20
      >
        <div rounded-2 bg-base bg-op-100 border="1 base" w-full h-full p4>
          <div text-sm pb2 mb2 font-bold border="b-1 base">
            <h2><span i-carbon-settings></span> 设置</h2>
          </div>
        </div>
      </div>
    </span>

    <span>
      <button
        icon-btn
        i-carbon-sun
        dark:i-carbon-moon
        lt-md:text-sm
        text-base
        @click="toggleDark()"
      />
    </span>
  </nav>
</template>

<style>
:root {
  --navbar-height: 60px;
}

@media (min-width: 1280px) {
  .backdrop-filter {
    backdrop-filter: saturate(50%) blur(8px);
  }
}

@media (max-width: 1279.9px) {
  .backdrop-filter {
    @apply shadow bg-white bg-opacity-40;
  }
}

@media (min-width: 1024px) {
  .nav-btn:hover .nav-dropdown,
  .nav-dropdown:hover {
    @apply !block transition;
  }
}
</style>
