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
>(fn: F): F {
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
        for (const res of resolves) {
          res.res(cache);
        }
        resolves.clear();
        return cache;
      } catch (error) {
        const entry = resolves.entries().next().value;
        if (entry) {
          resolves.delete(entry);
          wrapped()
            .then((r) => {
              entry.res?.(r);
            })
            .catch((e) => {
              entry.rej?.(e);
            });
        }
        throw error;
      } finally {
        running = false;
      }
    }
  };
  return wrapped;
}
