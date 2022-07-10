import cnchar from 'cnchar';
import trad from 'cnchar-trad';

cnchar.use(trad);

export const simpleToTrad = cnchar.convert.simpleToTrad;

export const tradToSimple = cnchar.convert.tradToSimple;

export function sleep(timeout = 1000): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
  });
}
