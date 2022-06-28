<script setup lang="ts">
import { useHead } from '@vueuse/head';

const route = useRoute();
const isLogin = computed(() => route.name === 'Login');

useHead({
  title: computed(() => {
    const title = route.meta?.title;
    return title ? `${title} - Anime Paste` : 'Anime Paste';
  })
});
</script>

<template>
  <NavBar></NavBar>
  <Banner v-if="!isLogin"></Banner>
  <div id="root-container" :class="isLogin || `pt8 px24 lt-md:px8`">
    <RouterView></RouterView>
  </div>
  <Footer :class="isLogin && ['fixed', 'bottom-0', 'w-full']"></Footer>
</template>

<style>
a {
  @apply opacity-90 hover:opacity-100;
  text-decoration: none;
  outline: none !important;
  color: var(--c-brand);
}
</style>
