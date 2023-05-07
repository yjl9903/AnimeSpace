import { onDeath } from '@animespace/core';

export async function loop(fn: () => void | Promise<void>, duration: string) {
  let timestamp: NodeJS.Timeout;
  onDeath(() => {
    clearTimeout(timestamp);
  });

  const time = parseDuration(duration);

  return new Promise(() => {
    const wrapper = async () => {
      await fn();
      timestamp = setTimeout(wrapper, time);
    };
    wrapper();
  });
}

function parseDuration(text: string) {
  const s = /^(\d+)s$/.exec(text);
  if (s) {
    return +s[1] * 1000;
  }
  const m = /^(\d+)m$/.exec(text);
  if (m) {
    return +m[1] * 60 * 1000;
  }
  const h = /^(\d+)h$/.exec(text);
  if (h) {
    return +h[1] * 60 * 60 * 1000;
  }
  return 10 * 60 * 1000;
}
