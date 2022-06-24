<script setup lang="ts"></script>

<template>
  <NavBar></NavBar>
  <div
    h="256px"
    w="full"
    class="hero"
    bg-op-40
    flex="~"
    items-center
    justify-center
    text="center base"
  >
    <div>
      <h1 text-4xl>Anime Paste</h1>
      <h2 font-light text-dark100 dark:text-light100 mt-2>
        <span>你所热爱的是你的动画</span>
      </h2>
    </div>
  </div>
  <div px8 lt-md:px-4>
    <RouterView></RouterView>
  </div>
  <Footer></Footer>
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
