import { Daemon } from './daemon';
import { context } from '../context';

export async function startDaemon(option: {
  once: boolean;
  interval: number;
  update: boolean;
}): Promise<void> {
  const daemon = new Daemon(option);

  // First update will force refresh info
  context.cliOption.force = true;
  await daemon.init();
  context.cliOption.force = false;

  return new Promise((res) => {
    let isRunning = false;
    const stamp = setInterval(async () => {
      if (isRunning) return;
      isRunning = true;
      await daemon.update();
      isRunning = true;

      if (option.once) {
        clearInterval(stamp);
        res();
      }
    }, option.interval * 60 * 1000);
  });
}
