<script setup lang="ts">
const route = useRoute();
const isLogin = computed(() => route.name === 'Login');
</script>

<template>
  <NavBar></NavBar>
  <Banner v-if="!isLogin"></Banner>
  <div :class="isLogin || `pt8 px24 lt-md:px8`">
    <RouterView></RouterView>
  </div>
  <Footer :class="isLogin && ['fixed', 'bottom-0', 'w-full']"></Footer>
</template>

<style>
.hero {
  background-image: -webkit-linear-gradient(
    105deg,
    rgba(0, 204, 170, var(--un-bg-opacity)) 20%,
    rgba(0, 204, 170, var(--un-bg-opacity)) 24%,
    rgba(0, 212, 233, var(--un-bg-opacity)) 60%,
    rgba(0, 213, 237, var(--un-bg-opacity)) 60%
  );
}
html.dark .hero {
  background-image: linear-gradient(
    105deg,
    rgba(2, 38, 32, 1) 20%,
    rgba(2, 38, 32, 1) 27%,
    rgba(21, 40, 42, 1) 60%,
    rgba(23, 41, 43, 1) 60%
  );
}
</style>
