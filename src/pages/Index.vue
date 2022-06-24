<script setup lang="ts">
const route = useRoute();
const src = route.query.src;
</script>

<template>
  <div flex="~" justify-center>
    <Player v-if="src" :options="{}" mt="4" w="600px">
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
