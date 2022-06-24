<script setup lang="ts">
const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <nav text-2xl flex="~ gap2" items-center px8 pt8 pb2>
    <h1 text-2xl font-serif op50 select-none cursor-pointer>
      <span font-bold>Anime Paste</span>
    </h1>
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
