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
        <!-- Paste your favourite anime online -->
        <span>你所热爱的是你的动画</span>
      </h2>
    </div>
  </div>
  <RouterView></RouterView>
  <Footer></Footer>
</template>

<style>
.hero {
  background-image: -webkit-linear-gradient(
    105.14177207717978deg,
    rgba(0, 204, 170, var(--un-bg-opacity)) 19.002220098920866%,
    rgba(0, 204, 170, var(--un-bg-opacity)) 24.61896888739009%,
    rgba(0, 212, 233, var(--un-bg-opacity)) 59.36443813699041%,
    rgba(0, 213, 237, var(--un-bg-opacity)) 61.32376910971223%
  );
}
html.dark .hero {
  background-image: linear-gradient(
    105.14177207717978deg,
    rgba(2, 38, 32, 1) 19.002220098920866%,
    rgba(2, 38, 32, 1) 26.578299860111912%,
    rgba(21, 40, 42, 1) 59.36443813699041%,
    rgba(23, 41, 43, 1) 61.32376910971223%
  );
}
</style>
