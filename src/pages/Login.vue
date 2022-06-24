<script setup lang="ts">
const router = useRouter();

const input = ref('');

const clear = () => (input.value = '');

const store = useClient();

const submit = () => {
  store.token = input.value;
  router.push('/');
};
</script>

<route>
{
  meta: {
    title: "登录"
  }
}
</route>

<template>
  <Banner fullscreen>
    <div relative border="~ rounded base" shadow font-200 text-base bg-base>
      <input
        v-model="input"
        aria-label="输入 access token"
        placeholder="输入 access token ..."
        type="text"
        autocomplete="off"
        w="full"
        p="l3 r8 y2"
        bg-transparent
        border-none
        class="!outline-none"
        @keypress.enter="submit"
      />
      <button
        v-if="input"
        absolute
        flex
        right-1
        w-8
        top-2
        bottom-2
        text-xl
        op30
        hover:op90
        aria-label="Clear search"
        @click="clear()"
      >
        <span i-carbon-close ma block aria-hidden="true" />
      </button>
    </div>
  </Banner>
</template>
