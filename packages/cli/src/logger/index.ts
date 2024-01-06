export * from './constant';

// https://gist.github.com/shingchi/64c04e0dd2cbbfbc1350
export function calcLength(text: string) {
  const RE = /[\u4e00-\u9fa5\uff00-\uffff\u3000\u3000-\u303f]/;
  let sum = 0;
  for (const c of text) {
    sum += RE.test(c) ? 2 : 1;
  }
  return sum;
}

export function padRight(texts: string[], fill = ' '): string[] {
  const length = texts.map((t) => calcLength(t)).reduce((max, l) => Math.max(max, l), 0);
  return texts.map((t) => t + fill.repeat(length - calcLength(t)));
}
