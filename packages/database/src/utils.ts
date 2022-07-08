export function sleep(timeout = 1000): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
  });
}
