import { format } from 'date-fns';
import { lightBlue, lightRed, link, lightGreen, lightYellow } from 'kolorist';

import type { IndexOption, Resource } from '@animepaste/database';

import { context } from '../context';

interface Logger {
  tab: Logger;

  println: (message: string, ...args: string[]) => void;
  info: (message: string, ...args: string[]) => void;
  warn: (message: string, ...args: string[]) => void;
  error: (message: string, ...args: string[]) => void;
  empty: () => void;
}

interface LoggerOption {
  prefix: string;
  tabwidth: number;
}

export const logger = factory({ prefix: '  ' });

function factory(option: Partial<LoggerOption> = {}) {
  const prefix = option.prefix ?? '';
  const tabwidth = option?.tabwidth ?? 0;
  const tab = ' '.repeat(tabwidth * 2);

  const println: Logger['println'] = (message, ...args) => {
    console.log(prefix + tab + message, ...args);
  };
  const info: Logger['info'] = (message, ...args) => {
    console.log(prefix + lightBlue('Info') + ' ' + tab + message, ...args);
  };
  const warn: Logger['warn'] = (message, ...args) => {
    console.log(prefix + lightYellow('Warn') + ' ' + tab + message, ...args);
  };
  const error: Logger['error'] = (message, ...args) => {
    console.log(prefix + lightRed('Error') + ' ' + tab + message, ...args);
  };

  const instance = new Proxy(
    {
      println,
      info,
      warn,
      error,
      empty() {
        console.log();
      }
    } as Logger,
    {
      get(target, key, receiver) {
        if (key === 'tab') {
          const cache = Reflect.get(target, key, receiver);
          if (cache) {
            return cache;
          }
          const nest = factory({
            ...option,
            tabwidth: tabwidth + 1
          });
          Reflect.set(target, key, nest, receiver);
          return nest;
        } else {
          return Reflect.get(target, key, receiver);
        }
      }
    }
  ) as Logger;

  return instance;
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
    logger.info(`Fetching ${pageLink}  ${time}`);
  } else {
    logger.info(`There are ${lightGreen(`${ok} magnets`)} collected`);
  }
};

export function printMagnets(magnets: Resource[], prefix = '  ') {
  magnets.sort((a, b) => a.title.localeCompare(b.title));
  for (const item of magnets) {
    logger.info(
      `${prefix}${link(item.title, context.magnetStore.idToLink(item.id))}`
    );
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
