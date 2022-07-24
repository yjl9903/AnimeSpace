export function ensureHTTPS(url: string) {
  const HTTP = 'http://';
  if (url.startsWith(HTTP)) return 'https://' + url.slice(HTTP.length);
  else return url;
}

export function useDocument() {
  const doc = ref<Document | undefined>();
  tryOnMounted(() => (doc.value = document));
  return doc;
}
