<script setup lang="ts">
const props = defineProps<{ color?: string }>();
const color = computed(() => props.color ?? 'bg-[#0ca]');
</script>

<template>
  <div class="playing">
    <span :class="[color, 'playing__bar playing__bar1']"></span>
    <span :class="[color, 'playing__bar playing__bar2']"></span>
    <span :class="[color, 'playing__bar playing__bar3']"></span>
  </div>
</template>

<style>
.playing {
  width: 2rem;
  height: 2rem;
  border-radius: 0.3rem;
  display: inline-flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0.5rem;
  box-sizing: border-box;
}

.playing__bar {
  display: inline-block;
  width: 30%;
  height: 100%;
  animation: up-and-down 1.3s ease infinite alternate;
}

.playing__bar1 {
  height: 60%;
}

.playing__bar2 {
  height: 30%;
  animation-delay: -2.2s;
}

.playing__bar3 {
  height: 75%;
  animation-delay: -3.7s;
}

@keyframes up-and-down {
  10% {
    height: 30%;
  }

  30% {
    height: 100%;
  }

  60% {
    height: 50%;
  }

  80% {
    height: 75%;
  }

  100% {
    height: 60%;
  }
}
</style>
