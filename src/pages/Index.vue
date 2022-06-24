<script setup lang="ts">
const now = new Date();
const weekday = now.getDay();
const weekDayLocale = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
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
      <h3>{{ weekDayLocale[7 - offset] }}</h3>
    </div>
  </div>
</template>
