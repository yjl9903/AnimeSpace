<script setup lang="ts">
const props = defineProps<{
  bgmId: string;
  ep: number;
  active?: number;
}>();

const { active, bgmId, ep } = toRefs(props);

const history = useHistory();

const isWatched = computed(() => history.findHistory(bgmId.value, ep.value));
</script>

<template>
  <router-link
    :to="{
      path: `/anime/${bgmId}/play/${ep}`
    }"
    inline-block
    w-18
    text-center
    text-gray-800
    text-base
    text-sm
    op70
    hover="bg-[#fff0ec] text-[#e50914] border-base"
    px2
    py1
    border="1 base rounded"
    :class="[
      ep === active
        ? 'bg-[#fff0ec] text-[#e50914] border-base'
        : isWatched
        ? 'bg-[#0ca] bg-op-30 border-[#0ca] border-op50'
        : ''
    ]"
  >
    第 {{ ep }} 话
  </router-link>
</template>
