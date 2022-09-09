import { Daemon } from './daemon';
import { context } from '../context';

export * from './plan';

export async function startDaemon(option: {
  once: boolean;
  interval: number;
  index: boolean;
  upload: boolean;
  sync: boolean;
}): Promise<void> {
  context.isDaemon = true;

  const daemon = new Daemon(option);

  await daemon.init();
  if (option.once) {
    return;
  }

  return new Promise(() => {
    let isRunning = false;
    setInterval(async () => {
      if (isRunning) return;
      isRunning = true;
      await context.init({ force: false });
      await daemon.update();
      isRunning = false;
    }, option.interval * 60 * 1000);
  });
}

export function createDaemon(index = false) {
  return new Daemon({ index, sync: false, upload: false });
}
