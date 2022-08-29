import { tradToSimple } from './utils';

export interface ParsedMagnet {
  title: string;
  ep: number | undefined;
  alias: string[];
  tags: string[];
}

const P1080 = ['1080P', '1080p', '1920x1080', '1920X1080'];
const P720 = ['720P', '720p', '1280x720', '1280X720'];
const P2160 = ['3840x2160', '3840X2160'];
const HEVC = ['HEVC-10bit', 'HEVC', 'MKV'];

export class MagnetParser {
  private readonly TAGS = [
    // Image Resolution
    ...P2160,
    ...P1080,
    ...P720,
    '1920x816',
    'x264',
    '60fps',
    // Web DL
    'TVrip',
    'WEB-DL',
    'WEBrip',
    'WebRip',
    'WEB-RIP',
    'BDRip',
    'BD-RIP',
    'DVDRIP',
    'Baha',
    'Bilibili',
    'bilibili',
    'ViuTV',
    'B-Global',
    // Video encode,
    ...HEVC,
    'MP4',
    'BIG5-MP4',
    'BIG5_MP4',
    'BIG5',
    'GB-MP4',
    'GB_MP4',
    'GB-JP',
    'GB_JP',
    'GB',
    'EAC3',
    // Audio encode
    'AVC 8bit',
    'AVC',
    'AAC',
    'ASS',
    'SRT',
    // Language
    'CHS',
    'CHT',
    '简繁日内封字幕',
    '简繁日内封',
    '简繁日双语',
    '简日双语字幕',
    '简繁内嵌字幕',
    '简繁内嵌',
    '简繁内封字幕',
    '简繁内封',
    '簡繁內封',
    '简体内嵌',
    '繁体内嵌',
    '繁體內嵌',
    '简繁字幕',
    '简繁外挂字幕',
    '简繁外挂',
    '简繁内挂',
    '简日双语',
    '简日字幕',
    '繁體外掛',
    '繁日雙語',
    '繁日字幕',
    '簡繁日外掛',
    '内封字幕',
    '简体',
    '简中',
    '繁體',
    '繁中',
    '英文',
    '内嵌',
    '内封'
  ];

  private readonly REMOVE = [
    /\[\d+\.\d+\.\d+\]/,
    /\[[vV]\d+\]/,
    // 招募
    /\[[^\[]*(招募|急招|招人)[^\]]*\]/,
    /（[^（]*(招募|急招|招人)[^）]*）/,
    /【[^【]*(招募|急招|招人)[^】]*】/,
    // Other
    'Donghua',
    /★0?1月新番★?/,
    /★0?4月新番★?/,
    /★0?7月新番★?/,
    /★10月新番★?/,
    /\[0?1月新番\]/,
    /【0?1月新番】/,
    /\[0?4月新番\]/,
    /【0?4月新番】/,
    /\[0?7月新番\]/,
    /【0?7月新番】/,
    /[10月新番]/,
    /【10月新番】/,
    '(先行版本)',
    '(正式版本)',
    '（僅限港澳台地區）',
    /\((检索|檢索)[^\)]*\)/,
    /（(检索|檢索)[^\)]*）/
  ];

  constructor() {}

  parse(title: string): ParsedMagnet {
    title = title.trim();
    title = this.removePrefix(title);
    const { title: newTitle1, ep } = this.extractEP(title);
    const { title: newTitle2, tags } = this.extractTags(newTitle1);
    title = this.removeBracket(newTitle2.trim());
    const [newTitle3, ...alias] = this.extractAlias(title);
    return { title: newTitle3, ep, tags, alias };
  }

  normalize(title: string) {
    title = tradToSimple(title);
    title = title.replace(/[“”‘’【】（）《》\s]/g, '');
    for (const [src, dst] of [
      ['！', '!'],
      ['¥', '$'],
      ['，', ','],
      ['。', '.'],
      ['；', ';'],
      ['：', ':'],
      ['？', '?'],
      ['～', '~']
    ]) {
      title = title.replace(src, dst);
    }
    return title;
  }

  normalizeMagnetTitle(originTitle: string) {
    const { title, alias } = this.parse(originTitle);
    const titles = [title, ...alias];
    return JSON.stringify(titles.map(this.normalize));
  }

  hevc(magnet: { tags: string[] }) {
    return magnet.tags.some((t) => HEVC.includes(t));
  }

  quality(magnet: { tags: string[] }) {
    for (const tag of magnet.tags) {
      if (P1080.includes(tag)) {
        return 1080;
      } else if (P720.includes(tag)) {
        return 720;
      }
    }
    return 1080;
  }

  language(magnet: { tags: string[] }) {
    for (const tag of magnet.tags) {
      if (tag.indexOf('简') !== -1) {
        return 'zh-Hans';
      } else if (tag.indexOf('繁') !== -1) {
        return 'zh-Hant';
      }
    }
    return 'zh-Hans';
  }

  private removeBracket(title: string) {
    for (const RE of [/^\[[^\]]+\]$/, /【[^】]+】/]) {
      if (RE.test(title)) {
        return title.substring(1, title.length - 1).trim();
      }
    }
    return title;
  }

  private removePrefix(title: string) {
    const RE1 = /^\[[^\]]+\]/;
    const RE2 = /^【[^】]+】/;
    const RE3 = /^\([^\)]+\)/;
    for (const RE of [RE1, RE2, RE3]) {
      if (RE.test(title)) {
        return title.replace(RE, '').trim();
      }
    }
    return title;
  }

  private extractTags(title: string) {
    const tags = [];
    for (const tag of this.TAGS) {
      const RE1 = new RegExp(`\\[${tag}\\]`);
      const RE2 = new RegExp(`【${tag}】`);
      const RE3 = new RegExp(`\\(${tag}\\)`);
      const RE4 = new RegExp(tag);
      for (const RE of [RE1, RE2, RE3, RE4]) {
        if (RE.test(title)) {
          title = title.replace(RE, '');
          tags.push(tag);
        }
      }
    }
    for (const tag of this.REMOVE) {
      title = title.replace(tag, '');
    }
    title = title
      .replace(/\[[\s_\-+&@]+\]/g, '')
      .replace(/【[\s_\-+&@]+】/g, '')
      .replace(/\([\s_\-+&@]+\)/g, '')
      .trim();
    return { title, tags };
  }

  private extractEP(title: string) {
    for (const RE of [
      /\[(\d+)([vV]\d+)?\]/,
      /【(\d+)([vV]\d+)?】/,
      /- (\d+) /,
      /- (\d+)$/,
      /第(\d+)話/,
      /第(\d+)话/,
      /第(\d+)集/
    ]) {
      const match = RE.exec(title);
      if (match) {
        title = title.replace(RE, '');
        return { title, ep: +match[1] };
      }
    }
    return { title, ep: undefined };
  }

  private extractAlias(title: string) {
    return title
      .split('/')
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
