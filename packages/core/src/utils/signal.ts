export { onDeath } from '@breadc/death';

export function onUncaughtException(fn: (error: Error) => void | Promise<void>) {
  process.on('uncaughtException', fn);
  return () => {
    process.removeListener('uncaughtException', fn);
  };
}

export function onUnhandledRejection(fn: (error: Error) => void | Promise<void>) {
  process.on('unhandledRejection', fn);
  return () => {
    process.removeListener('unhandledRejection', fn);
  };
}
