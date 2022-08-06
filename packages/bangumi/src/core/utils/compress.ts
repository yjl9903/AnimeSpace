import type {
  RawExportData,
  BaseBangumi,
  ExtendBangumi,
  ExtendBangumiSubject
} from '../types';

const shortcut: Array<
  [keyof BaseBangumi | keyof ExtendBangumi | keyof ExtendBangumiSubject, string]
> = [
  ['bgmId', 'i'],
  ['title', 't'],
  ['type', 'y'],
  ['titleCN', 'c'],
  ['titleTranslate', 'r'],
  ['lang', 'l'],
  ['officialSite', 'o'],
  ['begin', 'b'],
  ['end', 'e'],
  ['comment', 'm'],
  ['bgm', 'g']
];

const trans = new Map(shortcut);
const inverse = new Map(shortcut.map(([value, key]) => [key, value]));

export function compress(raw: RawExportData) {
  if (!raw.compress) {
    return raw;
  } else {
    return {
      compress: true,
      bangumis: raw.bangumis.map((bgm) => {
        const obj: any = {};
        for (const [key, value] of Object.entries(bgm)) {
          obj[trans.get(key as any)!] = value;
        }
        return obj;
      })
    };
  }
}

export function decompress(compressed: RawExportData): RawExportData {
  if (!compressed.compress) {
    return compressed;
  } else {
    return {
      compress: true,
      bangumis: compressed.bangumis.map((bgm) => {
        const obj: any = {};
        for (const [key, value] of Object.entries(bgm)) {
          obj[inverse.get(key as any)!] = value;
        }
        return obj;
      })
    };
  }
}
