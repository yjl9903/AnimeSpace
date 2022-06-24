<script setup lang="ts">
import now from '~build/time';
import { github, abbreviatedSha } from '~build/info';
import { format } from 'date-fns';
</script>

<template>
  <div mt8 class="text-center text-gray-500/50">
    <div flex items="center" justify="center" text="sm" font="mono">
      <a
        i-carbon-logo-github
        icon-btn
        text-gray-500
        hover:text="$c-brand"
        :href="`https://github.com/${github}`"
        target="_blank"
      ></a>
      <a
        ml="1"
        class="text-gray-500/50 hover:text-$c-brand"
        inline-block
        align-middle
        :href="`https://github.com/${github}/tree/${abbreviatedSha}`"
        target="_blank"
      >
        <span align-middle>{{ abbreviatedSha }}</span>
      </a>
    </div>
    <div flex items="center" justify="center" text="sm" font="mono">
      <span i-carbon-time class="text-gray-500/50"></span>
      <span ml="1" class="text-gray-500/50" inline-block align-middle>
        <span align-middle>{{ format(now, 'yyyy-MM-dd HH:mm') }}</span>
      </span>
    </div>
    <div mb="4" text="sm" font="mono">
      <span
        >Powered by
        <a href="https://github.com/XLorPaste/AnimePaste" alt="Vite"
          >Anime Paste</a
        ></span
      >
    </div>
  </div>
</template>
