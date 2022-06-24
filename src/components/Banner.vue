<script setup lang="ts">
defineProps<{ fullscreen?: boolean }>();
</script>

<template>
  <div
    :class="[fullscreen ? 'h-[100vh]' : 'h-256px']"
    w="full"
    class="hero shadow-light-900"
    bg-op-40
    flex="~"
    items-center
    justify-center
    text="center base"
  >
    <div>
      <h1 text-4xl>Anime Paste</h1>
      <h2 font-light text-dark100 dark:text-light100 my-2>
        <span>你所热爱的是你的动画</span>
      </h2>
      <slot></slot>
    </div>
  </div>
</template>
