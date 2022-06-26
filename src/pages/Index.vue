<script setup lang="ts">
import type { OverviewSubject } from '~/composables/bangumi/types';

const now = new Date();
const weekday = now.getDay();
const weekDayLocale = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

onMounted(async () => {
  const ScrollReveal = (await import('scrollreveal')).default;
  ScrollReveal().reveal('.anime-card');
});

const client = useClient();
const bangumi = useBangumi();

const hiddenBgm = new Set([975]);

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
    <div text-2xl mb4 font-bold>
      <h2><span i-carbon-calendar></span> 番剧周历</h2>
    </div>
    <div border="1 base" rounded-2 shadow-box>
      <div
        v-for="offset in 7"
        border="base"
        :class="[offset < 7 && 'border-b-1']"
        :key="offset"
        p4
      >
        <h3 mb4 flex="~" items-center>
          <span font-bold text-lg>{{ weekDayLocale[(13 - offset) % 7] }}</span>
        </h3>
        <div flex="~ wrap gap4" lt-md:justify-between>
          <div
            v-for="bgm in bangumi.calendar[(13 - offset) % 7]
              .filter(filterBgm)
              .sort(sortBgm)"
            :key="bgm.id"
            w="140px lt-md:130px"
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
                  :srcset="bgm.images.medium"
                  media="(max-width: 767.9px)"
                  rounded-2
                />
                <img
                  :src="bgm.images.large"
                  :alt="'Picture for ' + bgm.name_cn"
                  object-fill
                  w="full"
                  h="196px lt-md:180px"
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
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
