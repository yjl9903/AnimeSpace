<script setup lang="ts">
const isDark = useDark();
const toggleDark = useToggle(isDark);

const doc = ref<Document | null>(null);
onMounted(() => {
  doc.value = document;
});
const { arrivedState } = useScroll(doc);
const { top } = toRefs(arrivedState);
</script>

<template>
  <div v-show="!top" lt-xl="z-9 w-full h-$navbar-height fixed bg-white"></div>
  <nav
    text-xl
    lt-md:text-lg
    z-10
    w-full
    h="$navbar-height"
    fixed
    flex="~ gap4 lt-md:gap2"
    items-center
    px8
    transition="all"
    duration="200"
    :class="[top || 'backdrop-filter hero']"
  >
    <h1 font-sans select-none cursor-pointer>
      <router-link to="/" class="text-base select-none"
        >Anime Paste</router-link
      >
    </h1>
    <router-link
      to="/list"
      text-lg
      hover="bg-op-50 bg-white dark:bg-gray/50"
      px4
      py2
      lt-md:px1
      lt-md:py1
      rounded-2
    >
      <span text-base font-light select-none>放映</span>
    </router-link>
    <router-link
      to="/list"
      text-lg
      hover="bg-op-50 bg-white dark:bg-gray/50"
      px4
      py2
      lt-md:px1
      lt-md:py1
      rounded-2
    >
      <span text-base font-light select-none>番剧</span>
    </router-link>
    <div flex-auto />
    <router-link
      icon-btn
      i-carbon-recently-viewed
      lt-md:text-sm
      text-base
      to="/history"
    />
    <a
      icon-btn
      i-carbon-logo-github
      lt-md:text-sm
      text-base
      href="https://github.com/XLorPaste/AnimePaste"
      target="_blank"
      title="GitHub"
    />
    <button
      icon-btn
      i-carbon-sun
      dark:i-carbon-moon
      lt-md:text-sm
      text-base
      @click="toggleDark()"
    />
  </nav>
</template>

<style>
:root {
  --navbar-height: 60px;
}

@media (min-width: 1280px) {
  .backdrop-filter {
    backdrop-filter: saturate(50%) blur(8px);
  }
}

@media (max-width: 1279.9px) {
  .backdrop-filter {
    @apply shadow bg-white bg-opacity-40;
  }
}
</style>
