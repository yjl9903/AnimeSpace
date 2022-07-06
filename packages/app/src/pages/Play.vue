<script setup lang="ts">
const route = useRoute();
const src = route.query.src as string;
</script>

<route>
{
  meta: {
    title: "播放"
  }
}
</route>

<template>
  <div flex="~" justify-center>
    <Player
      v-if="src"
      :source="{
        type: 'video',
        sources: [{ src }]
      }"
      mt="4"
      max-w="full"
      h="80vh"
      aspect-video
    >
      <video controls playsinline crossorigin="anonymous"></video>
    </Player>
  </div>
</template>
