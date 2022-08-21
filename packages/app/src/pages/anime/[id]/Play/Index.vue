<script setup lang="ts">
const route = useRoute();
const router = useRouter();
router.replace(route.path + '/1');
</script>

<route>
{
  name: "AnimePlayIndex"
}
</route>

<template></template>
