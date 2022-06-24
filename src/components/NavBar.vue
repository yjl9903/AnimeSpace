<script setup lang="ts">
const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <nav
    text-xl
    z-10
    w-full
    flex="~ gap4 lt-md:gap2"
    items-center
    px8
    h="$navbar-height"
    fixed
  >
    <h1 font-sans select-none cursor-pointer>
      <router-link to="/" class="text-base">Anime Paste</router-link>
    </h1>
    <div
      text-lg
      hover="bg-op-50 bg-white dark:bg-gray/50"
      px4
      py2
      lt-md:px2
      rounded-2
    >
      <router-link to="/list" text-base font-light>番剧</router-link>
    </div>
    <div flex-auto />
    <a
      icon-btn
      i-carbon-logo-github
      text-base
      href="https://github.com/XLorPaste/AnimePaste"
      target="_blank"
      title="GitHub"
    />
    <button
      icon-btn
      i-carbon-sun
      dark:i-carbon-moon
      text-base
      @click="toggleDark()"
    />
  </nav>
</template>

<style>
:root {
  --navbar-height: 60px;
}
</style>
