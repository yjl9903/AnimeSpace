import { useHead } from '@vueuse/head';
import { getBgmTitle } from '~/composables/bangumi';

export function useAnimeInfo() {
  const route = useRoute();

  const { id, ep } = toRefs<{ id: string; ep: string }>(
    reactive(route.params as any)
  );
  watch(
    () => route.params,
    (params) => {
      id.value = params.id as string;
      ep.value = params.ep as string;
    }
  );

  const bangumi = useBangumi();

  const bgmData = computed(() => {
    return id.value ? bangumi.bgmIdMap.get(id.value) : undefined;
  });

  const subject = computedAsync(async () => {
    return id.value ? await bangumi.subject(id.value) : undefined;
  });

  const client = useClient();

  const onair = computed(() => {
    if (client.onairMap.has(id.value)) {
      return client.onairMap.get(id.value)!;
    }
  });

  useHead({
    title: computed(() => {
      if (bgmData.value) {
        return bgmData.value
          ? `${getBgmTitle(bgmData.value)} - Anime Paste`
          : 'Anime Paste';
      } else {
        return 'Anime Paste';
      }
    })
  });

  return {
    id,
    ep,
    bgmData,
    subject,
    onair
  };
}
