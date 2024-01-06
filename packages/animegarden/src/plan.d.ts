import '@animespace/core';

declare module '@animespace/core' {
  interface AnimePlan {
    bgm: string;
  }

  interface LocalVideoSource {
    magnet?: string;
  }
}
