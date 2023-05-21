import { describe, expect, it } from 'vitest';

import { useAsyncSingleton, useSingleton } from '../src';

describe('useSingleton', () => {
  it('should work', () => {
    let count = 0;
    const value = useSingleton(() => {
      return ++count;
    });
    expect(value()).toBe(1);
    expect(count).toBe(1);
    expect(value()).toBe(1);
    expect(count).toBe(1);
    expect(value()).toBe(1);
    expect(count).toBe(1);
    expect(value()).toBe(1);
    expect(count).toBe(1);
    expect(value()).toBe(1);
    expect(count).toBe(1);
  });

  it('should throw error and cache first ok', () => {
    let count = 0;
    const value = useSingleton(() => {
      if (count++ < 2) {
        throw new Error('count < 2');
      }
      return 2;
    });
    expect(() => value()).toThrowErrorMatchingInlineSnapshot('"count < 2"');
    expect(count).toBe(1);
    expect(() => value()).toThrowErrorMatchingInlineSnapshot('"count < 2"');
    expect(count).toBe(2);
    expect(value()).toBe(2);
    expect(value()).toBe(2);
    expect(value()).toBe(2);
    expect(count).toBe(3);
  });
});

describe('useAsyncSingleton', () => {
  it('should work', async () => {
    let count = 0;
    const value = useAsyncSingleton(async () => {
      await sleep(100);
      return count++;
    });
    expect(await value()).toBe(0);
    expect(await value()).toBe(0);
    expect(await value()).toBe(0);
    expect(count).toBe(1);
  });

  it('should handle call during running', async () => {
    let count = 0;
    const value = useAsyncSingleton(async () => {
      await sleep(10);
      return count++;
    });
    const task1 = value();
    const task2 = value();
    const task3 = value();
    expect(await task1).toBe(0);
    expect(await task2).toBe(0);
    expect(await task3).toBe(0);
    expect(count).toBe(1);
  });

  it('should handle error', async () => {
    let count = 0;
    const value = useAsyncSingleton(
      async () => {
        await sleep(10);
        if (count++ < 2) {
          throw new Error('count < 2');
        }
        return 2;
      },
      { retry: true }
    );
    const task1 = value();
    const task2 = value();
    const task3 = value();
    const task4 = value();
    expect(() => task1).rejects.toThrowErrorMatchingInlineSnapshot(
      '"count < 2"'
    );
    expect(() => task2).rejects.toThrowErrorMatchingInlineSnapshot(
      '"count < 2"'
    );
    expect(await task3).toBe(2);
    expect(await task4).toBe(2);
  });
});

function sleep(time: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), time);
  });
}
