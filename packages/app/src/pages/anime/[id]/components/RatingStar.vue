<script setup lang="ts">
defineProps<{ bgmId: string | number; rating: number }>();
</script>

<template>
  <div class="text-[#F3AB46] relative">
    <div class="text-right">
      <span v-if="rating >= 1" i-ic-round-star></span>
      <span v-else-if="rating >= 0" i-ic-round-star-half></span>
      <span v-else i-ic-round-star-border></span>

      <span v-if="rating >= 3" i-ic-round-star></span>
      <span v-else-if="rating >= 2" i-ic-round-star-half></span>
      <span v-else i-ic-round-star-border></span>

      <span v-if="rating >= 5" i-ic-round-star></span>
      <span v-else-if="rating >= 4" i-ic-round-star-half></span>
      <span v-else i-ic-round-star-border></span>

      <span v-if="rating >= 7" i-ic-round-star></span>
      <span v-else-if="rating >= 6" i-ic-round-star-half></span>
      <span v-else i-ic-round-star-border></span>

      <span v-if="rating >= 9" i-ic-round-star></span>
      <span v-else-if="rating >= 8" i-ic-round-star-half></span>
      <span v-else i-ic-round-star-border></span>
    </div>
    <a
      :href="`https://bangumi.tv/subject/${bgmId}`"
      target="_blank"
      class="text-[#F3AB46]"
      absolute
      right-0
      text-4xl
      select-none
    >
      <span>{{ rating.toFixed(0) }}</span>
      <span>.</span>
      <span>{{ Math.round(rating * 10) % 10 }}</span>
    </a>
  </div>
</template>
