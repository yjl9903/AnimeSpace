import { format } from 'date-fns';
import { lightBlue, lightRed, link } from 'kolorist';

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
  const pageLink = link(`page ${page}`, url);
  const time = timestamp ? `(${format(timestamp, 'yyyy-MM-dd HH:mm')})` : '';
  if (ok === undefined) {
    info(`Fetching ${pageLink} ${time}`);
  } else {
    info(`Collect ${ok} magnets on ${pageLink} ${time}`);
  }
};

export function printMagnets(magnets: Resource[], prefix = '  ') {
  magnets.sort((a, b) => a.title.localeCompare(b.title));
  for (const item of magnets) {
    info(`${prefix}${link(item.title, context.magnetStore.idToLink(item.id))}`);
  }
}
