import type { BaseBangumi, ExtendBangumi } from './dist';

export const compress: boolean;

export const bangumis: Array<
  BaseBangumi & Pick<ExtendBangumi, 'titleCN' | 'begin'>
>;
