import { Daemon } from './daemon';
import { context } from '../context';

export async function startDaemon(option: {
  once: boolean;
  interval: number;
  update: boolean;
}): Promise<void> {
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
      isRunning = true;
    }, option.interval * 60 * 1000);
  });
}
