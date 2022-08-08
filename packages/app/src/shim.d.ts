declare module '~bangumi/data' {
  import type { Item } from 'bangumi-data';

  export const bangumis: Item[];
}

declare module '~build/meta' {
  export const PUBLIC: boolean;
}
