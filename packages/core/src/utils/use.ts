export function useSingleton<T extends unknown, F extends () => T>(fn: F): F {
  let cache: T;
  let initialized = false;
  // @ts-ignore
  const wrapped: F = (): T => {
    if (initialized) {
      return cache;
    } else {
      cache = fn();
      initialized = true;
      return cache;
    }
  };
  return wrapped;
}

export function useAsyncSingleton<
  T extends unknown,
  F extends () => Promise<T>
>(fn: F, options: { retry?: boolean } = {}): F {
  let cache: T;
  let initialized = false;

  let running = false;
  let resolves = new Set<{
    res: (cache: T) => void;
    rej: (error: unknown) => void;
  }>();

  // @ts-ignore
  const wrapped: F = async (): Promise<T> => {
    if (initialized) {
      return cache;
    } else if (running) {
      return new Promise((res, rej) => {
        resolves.add({
          res,
          rej
        });
      });
    } else {
      try {
        running = true;
        cache = await fn();
        initialized = true;
        running = false;
        for (const res of resolves) {
          res.res(cache);
        }
        resolves.clear();
        return cache;
      } catch (error) {
        if (options.retry) {
          const [entry] = resolves.values();
          if (entry) {
            resolves.delete(entry);
            running = false;
            wrapped()
              .then((r) => {
                entry.res(r);
              })
              .catch((e) => {
                entry.rej(e);
              });
          }
        } else {
          for (const cb of resolves) {
            cb.rej(error);
          }
        }
        throw error;
      }
    }
  };
  return wrapped;
}
