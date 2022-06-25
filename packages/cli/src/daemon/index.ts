import { Daemon } from './daemon';

export async function startDaemon(option: {
  once: boolean;
  interval: number;
  update: boolean;
}): Promise<void> {
  const daemon = new Daemon(option);

  await daemon.init();

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
