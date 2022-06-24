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
    <h2><span i-carbon-list></span> 所有番剧</h2>
  </div>
  <div>
    <div v-for="anime in onair" border="1 base" rounded-2 p4>
      <h3>{{ anime.title }}</h3>
    </div>
  </div>
</template>
