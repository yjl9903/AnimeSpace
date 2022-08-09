import { useHead } from '@vueuse/head';

export function useAnimeInfo() {
  const route = useRoute();
  const router = useRouter();

  const id = ref((route.params?.id ?? '') as string);
  const ep = ref((route.params?.ep ?? '') as string);
  watch(
    () => route.params,
    (params) => {
      id.value = params.id as string;
      ep.value = params.ep as string;
    },
    { immediate: true }
  );

  const bangumi = useBangumi();

  const bgm = bangumi.useBgm(id.value, {
    error() {
      router.replace({ name: 'Index' });
    }
  });

  const client = useClient();

  const onair = computed(() => {
    if (client.onairMap.has(id.value)) {
      return client.onairMap.get(id.value)!;
    }
  });

  const title = computed(() => bgm.value?.titleCN ?? bgm.value?.title ?? '');

  useHead({
    title: computed(() => {
      if (title.value) {
        return title.value ? `${title.value} - Anime Paste` : 'Anime Paste';
      } else {
        return 'Anime Paste';
      }
    })
  });

  return {
    id,
    ep,
    bgm,
    title,
    onair
  };
}
