export function ensureHTTPS(url: string) {
  const HTTP = 'http://';
  if (url.startsWith(HTTP)) return url.slice(HTTP.length) + 'https://';
  else return url;
}
