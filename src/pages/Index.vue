<script setup lang="ts">
import type { OverviewSubject } from '~/composables/bangumi/types';

const now = new Date();
const weekday = now.getDay();
const weekDayLocale = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

onMounted(async () => {
  const ScrollReveal = (await import('scrollreveal')).default;
  ScrollReveal().reveal('.anime-card');
});

const bangumi = useBangumi();

const filterBgm = (subject: OverviewSubject) => {
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
        <span font-bold text-lg>{{ weekDayLocale[7 - offset] }}</span>
      </h3>
      <div flex="~ wrap gap4" lt-md:justify-around>
        <div
          v-for="bgm in bangumi.calendar[7 - offset].filter(filterBgm)"
          :key="bgm.id"
          w="160px  lt-md:120px"
          mb4
          class="anime-card"
        >
          <router-link
            tag="div"
            :to="'/anime/' + bgm.id"
            w="full"
            h="200px"
            flex="~"
            items-center
            justify-start
          >
            <img
              :src="bgm.images.large"
              :alt="'Picture for ' + bgm.name_cn"
              object-contain
              max-w="full"
              max-h="full"
              rounded-2
              hover="shadow shadow-light-900 shadow-lg"
              cursor="pointer"
            />
          </router-link>
          <a
            :href="bgm.url"
            target="_blank"
            class="text-base hover:text-$c-brand text-sm"
            >{{ bgm.name_cn !== '' ? bgm.name_cn : bgm.name }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>
