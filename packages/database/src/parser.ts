export class Parser {
  static TAGS = [
    // Image Resolution
    '1080P',
    '1080p',
    '720P',
    '720p',
    '1920x1080',
    '1920X1080',
    '1280x720',
    '1280X720',
    // Web DL
    'WEB-DL',
    'WebRip',
    'WEB-RIP',
    'BDRip',
    'BD-RIP',
    'Baha',
    'Bilibili',
    'bilibili',
    'ViuTV',
    'B-Global',
    // Video encode,
    'HEVC-10bit',
    'HEVC',
    'MKV',
    'MP4',
    'BIG5_MP4',
    'BIG5',
    'GB_MP4',
    // Audio encode
    'AVC',
    'AAC',
    // Language
    'CHT',
    'CHS',
    '简繁内嵌字幕',
    '简繁内嵌',
    '简繁内封字幕',
    '简繁内封',
    '简繁字幕',
    '简日双语',
    '繁日雙語',
    '簡繁日外掛',
    '内封字幕',
    '简体',
    '繁體',
    '内嵌'
  ];

  static REMOVE = [
    // 招募
    /\[招募[^\]]*\]/,
    // Other
    '★01月新番★',
    '★04月新番★',
    '★07月新番★',
    '★10月新番★'
  ];

  constructor() {}

  parse(title: string) {
    title = title.trim();
    title = this.removePrefix(title);
    const { title: newTitle1, tags } = this.extractTags(title);
    const { title: newTitle2, ep } = this.extractEP(newTitle1);
    title = this.removeBracket(newTitle2.trim());
    const [newTitle3, ...alias] = this.extractAlias(title);
    return { title: newTitle3, ep, tags, alias };
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
    for (const tag of Parser.TAGS) {
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
    for (const tag of Parser.REMOVE) {
      title = title.replace(tag, '');
    }
    title = title
      .replace(/\[[\s_\-+&]+\]/g, '')
      .replace(/【[\s_\-+&]+】/g, '')
      .replace(/\([\s_\-+&]+\)/g, '')
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
