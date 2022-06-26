export function ensureHTTPS(url: string) {
  const HTTP = 'http://';
  if (url.startsWith(HTTP)) return 'https://' + url.slice(HTTP.length);
  else return url;
}
