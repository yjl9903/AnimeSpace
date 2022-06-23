import { Daemon } from './daemon';

export async function startDaemon(option: {
  once: boolean;
  interval: number;
}): Promise<void> {
  const daemon = new Daemon();

  await daemon.init();

  return new Promise((res) => {
    const stamp = setInterval(async () => {
      await daemon.update();

      if (option.once) {
        clearInterval(stamp);
        res();
      }
    }, option.interval * 60 * 1000);
  });
}
