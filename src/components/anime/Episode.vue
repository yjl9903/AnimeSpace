<script setup lang="ts">
const props = defineProps<{
  bgmId: string;
  ep: number;
  active?: number;
}>();
const { active, bgmId, ep } = toRefs(props);
</script>

<template>
  <router-link
    :to="{
      path: `/anime/${bgmId}/play/${ep}`
    }"
    inline-block
    w-18
    text-center
    text-base
    text-sm
    op70
    hover="bg-[#fff0ec] text-[#e50914]"
    px2
    py1
    border="1 base rounded"
    :class="[ep === active && 'bg-[#fff0ec] text-[#e50914]']"
  >
    第 {{ ep }} 话
  </router-link>
</template>
