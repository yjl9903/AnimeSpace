<script setup lang="ts">
const route = useRoute();
const name = route.params.anime as string;
</script>

<template>
  <div>Play: {{ name }}</div>
</template>
