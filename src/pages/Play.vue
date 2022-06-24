<script setup lang="ts">
const route = useRoute();
const src = route.query.src;
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
    <Player v-if="src" :options="{}" mt="4" max-w="full" h="80vh" aspect-video>
      <video controls playsinline crossorigin="anonymous">
        <source
          size="1080"
          :src="`https://video.xlorpaste.cn/sv/${src}/${src}.mp4`"
          type="video/mp4"
        />
      </video>
    </Player>
  </div>
</template>
