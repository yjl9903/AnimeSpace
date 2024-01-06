// See https://twitter.com/mattpocockuk/status/1622730173446557697
// export type Identity<T> = T;
// type Prettify<T> = Identity<{ [K in keyof T]: T[K] }>
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
