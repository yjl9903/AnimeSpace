export function onUnhandledRejection(
  fn: (error: Error) => void | Promise<void>
) {
  process.on('unhandledRejection', fn);
  return () => {
    process.removeListener('unhandledRejection', fn);
  };
}

export function onDeath(fn: () => void | Promise<void>) {
  process.on('SIGINT', fn);
  return () => {
    process.removeListener('SIGINT', fn);
  };
}
