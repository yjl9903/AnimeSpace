import '@animespace/core';

declare module '@animespace/core' {
  interface AnimePlan {
    bgm: string;

    fansub: string[];
  }

  interface LocalVideoSource {
    magnet?: string;
  }
}
