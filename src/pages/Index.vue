<script setup lang="ts">
import type { OverviewSubject } from '~/composables/bangumi/types';
import { ensureHTTPS } from '~/composables';

const now = new Date();
const weekday = now.getDay();
const weekDayLocale = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

onMounted(async () => {
  const ScrollReveal = (await import('scrollreveal')).default;
  ScrollReveal().reveal('.anime-card');
});

const client = useClient();
const bangumi = useBangumi();

const hiddenBgm = new Set([899, 975]);

const isOnair = (subject: OverviewSubject) => {
  return client.onairMap.has(String(subject.id));
};

const toBgmData = (subject: OverviewSubject) => {
  return bangumi.bgmIdMap.get(String(subject.id));
};

const sortBgm = (a: OverviewSubject, b: OverviewSubject) => {
  const x = isOnair(a) ? 0 : 1;
  const y = isOnair(b) ? 0 : 1;
  if (x === y) {
    return toBgmData(a)!.begin.localeCompare(toBgmData(b)!.begin);
  } else {
    return x - y;
  }
};

const filterBgm = (subject: OverviewSubject) => {
  if (hiddenBgm.has(subject.id)) return false;
  return bangumi.bgmIdMap.has(String(subject.id)) && subject.name_cn !== '';
};
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
    <div text-2xl mb4 font-bold ref="calendarEl">
      <h2><span i-carbon-calendar></span> 番剧周历</h2>
    </div>
    <div flex="~ gap4">
      <div border="1 base" rounded-2 shadow-box bg-gray-100:30 md:mr4 flex-grow>
        <div
          v-for="offset in 7"
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
          <div
            grid="~ flow-row gap4 xl:cols-7 lg:cols-4 md:cols-3 lt-md:cols-2"
          >
            <div
              v-for="bgm in bangumi.calendar[(13 - offset) % 7]
                .filter(filterBgm)
                .sort(sortBgm)"
              :key="bgm.id"
              w="140px lt-md:100px"
              lt-md:mb4
              class="anime-card"
            >
              <router-link tag="div" :to="'/anime/' + bgm.id" w="full">
                <picture
                  w="full"
                  flex="~"
                  items-center
                  justify-center
                  lt-md:justify-start
                  text-0
                  relative
                >
                  <source
                    :srcset="ensureHTTPS(bgm.images.medium)"
                    media="(max-width: 767.9px)"
                    rounded-2
                  />
                  <img
                    :src="ensureHTTPS(bgm.images.large)"
                    :alt="'Picture for ' + bgm.name_cn"
                    object-fill
                    w="full"
                    h="196px lt-md:140px"
                    rounded-2
                    hover="shadow shadow-light-900 dark:shadow-dark-900 shadow-lg bg-transparent"
                    cursor="pointer"
                  />
                  <Playing
                    v-if="isOnair(bgm)"
                    absolute
                    top="-5"
                    right="-2"
                    color="bg-[#0ca]"
                  ></Playing>
                </picture>
              </router-link>
              <a
                :href="bgm.url"
                target="_blank"
                class="text-base hover:text-$c-brand text-sm font-light"
                >{{ bgm.name_cn !== '' ? bgm.name_cn : bgm.name }}</a
              >
            </div>
            <div flex-grow></div>
          </div>
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
        mr="-4"
      >
        <div class="left-large-dot"></div>
        <div
          v-scroll-to="{ el: `#calendar-${offset}`, offset: -60 }"
          v-for="offset in 7"
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
