<script setup lang="ts">
const { onair } = useClient();
</script>

<route>
{
  meta: {
    title: "所有番剧"
  }
}
</route>

<template>
  <div text-2xl mb4 font-bold>
    <h2><span i-carbon-list></span> 正在播出</h2>
  </div>
  <div>
    <div v-for="anime in onair" border="1 base" rounded-2 p4 mb4>
      <h3 mb4 font-bold>{{ anime.title }}</h3>
      <div flex="~ gap4 wrap">
        <router-link
          v-for="ep in anime.episodes"
          :to="{ path: '/play', query: { src: ep.playURL } }"
          inline-block
          w-20
          text-center
          text-base
          text-sm
          bg-gray-100
          op70
          hover:op100
          px2
          py1
          border="1 base rounded"
        >
          第 {{ ep.ep }} 话
        </router-link>
      </div>
    </div>
  </div>
</template>
