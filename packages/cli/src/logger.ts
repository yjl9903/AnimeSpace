import { format } from 'date-fns';
import { lightBlue, lightRed, link, lightGreen } from 'kolorist';

import type { IndexOption, Resource } from '@animepaste/database';

import { context } from './context';

export function info(message?: string, ...args: any[]) {
  if (message !== undefined) {
    console.log(`  ${lightBlue('Info')} ${message}`, ...args);
  } else {
    console.log();
  }
}

export function error(message: string, ...args: any[]) {
  console.log(`  ${lightRed('Error')} ${message}`, ...args);
}

export const IndexListener: IndexOption['listener'] = ({
  page,
  url,
  timestamp,
  ok
}) => {
  const pageLink = lightBlue(link(`P${page}`, url));
  const time = timestamp ? `(${format(timestamp, 'yyyy-MM-dd HH:mm')})` : '';
  if (ok === undefined) {
    info(`Fetching ${pageLink}  ${time}`);
  } else {
    info(`There are ${lightGreen(`${ok} magnets`)} collected`);
  }
};

export function printMagnets(magnets: Resource[], prefix = '  ') {
  magnets.sort((a, b) => a.title.localeCompare(b.title));
  for (const item of magnets) {
    info(`${prefix}${link(item.title, context.magnetStore.idToLink(item.id))}`);
  }
}

function calcLength(text: string) {
  const RE = /[\u4e00-\u9fa5]/;
  let sum = 0;
  for (const c of text) {
    sum += RE.test(c) ? 2 : 1;
  }
  return sum;
}

export function padRight(texts: string[], fill = ' '): string[] {
  const length = texts
    .map((t) => calcLength(t))
    .reduce((max, l) => Math.max(max, l), 0);
  return texts.map((t) => t + fill.repeat(length - calcLength(t)));
}
