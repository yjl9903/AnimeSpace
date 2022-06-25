import { Daemon } from './daemon';
import { context } from '../context';

export async function startDaemon(option: {
  once: boolean;
  interval: number;
  update: boolean;
}): Promise<void> {
  const daemon = new Daemon(option);

  await daemon.init();
  context.cliOption.force = false;
  if (option.once) {
    return;
  }

  return new Promise(() => {
    let isRunning = false;
    setInterval(async () => {
      if (isRunning) return;
      isRunning = true;
      await daemon.update();
      isRunning = true;
    }, option.interval * 60 * 1000);
  });
}
