<script setup lang="ts">
const now = new Date();
const weekday = now.getDay();
const weekDayLocale = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const bangumi = useBangumi();

const filterNoCN = (subject: OverviewSubject) => subject.name_cn !== '';
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
  <div border="1 base" rounded-2>
    <div
      v-for="offset in 7"
      border="base"
      :class="[offset < 7 && 'border-b-1']"
      p4
    >
      <h3 mb4 flex="~" items-center>
        <span font-bold text-lg>{{ weekDayLocale[7 - offset] }}</span>
      </h3>
      <div flex="~ wrap gap4">
        <div
          v-for="bgm in bangumi.calendar[7 - offset].filter(filterNoCN)"
          w="160px"
        >
          <div w="160px" h="200px" flex="~" items-center justify-start>
            <img
              :src="bgm.images.large"
              :alt="'Picture for ' + bgm.name_cn"
              object-contain
              max-w="160px"
              max-h="200px"
              rounded-2
              cursor="pointer"
            />
          </div>
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
