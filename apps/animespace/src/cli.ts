import 'dotenv/config';

import { breadc } from 'breadc';
import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';

import { version, description } from '../package.json';

import { makeSystem } from './system/system.ts';
import { searchResources } from './command/animegarden.ts';
import { searchBangumi, importBangumiCollection } from './command/bangumi.ts';
import {
  listStorage,
  getStorage,
  putStorage,
  removeStorage,
  moveStorage
} from './command/storage.ts';
import {
  getSubjects,
  getSubject,
  printParsedResources,
  printExtractedResources
} from './command/subject.ts';

const app = breadc('anime', {
  version,
  description: {
    text: `${description}\n\n管理动画订阅、搜索资源，并同步下载与存储。\n使用 anime <命令> --help 查看详细说明。`,
    examples: [
      { command: 'anime -C ./space watch', comment: '使用指定配置目录持续追番' },
      { command: 'anime garden search "葬送的芙莉莲"', comment: '搜索 Anime Garden 资源' },
      {
        command: 'anime bangumi collection --uid your-name --dump',
        comment: '导出 Bangumi 在看收藏'
      },
      { command: 'anime storage list', comment: '查看默认存储的根目录' }
    ]
  },
  locale: 'zh'
})
  .option('-C, --dir <path>', '配置目录，读取其中的 anime.yaml；默认使用 ~/.animespace')
  .use(async (ctx, next) => {
    const dir = ctx.options.get('dir')?.value();
    const system = await makeSystem(typeof dir === 'string' ? dir : undefined);
    try {
      return await next({ data: { system } });
    } finally {
      system.close();
    }
  });

app
  .command('watch', {
    summary: '持续同步、下载并上传动画资源',
    text: '循环检查已启用的动画订阅并推送更新，按 Ctrl+C 停止。未指定筛选条件时处理所有已启用条目。',
    examples: [{ command: 'anime watch --name "葬送的芙莉莲"', comment: '仅追踪名称匹配的订阅' }]
  })
  .option('-n, --name <string>', '按动画条目名称包含的文本筛选')
  .option('--bgm <id>', '按 Bangumi 条目 ID 筛选')
  .action(async (options, context) => {
    const { system } = context.data;
    return await system.watchSubjects({ name: options.name, bgm: options.bgm });
  });

app
  .command('push', {
    summary: '执行一轮动画资源同步、下载与上传',
    text: '等待本轮任务完成后退出。未指定筛选条件时处理所有已启用条目。',
    examples: [{ command: 'anime push --name "葬送的芙莉莲"', comment: '立即更新指定订阅' }]
  })
  .option('-n, --name <string>', '按动画条目名称包含的文本筛选')
  .option('--bgm <id>', '按 Bangumi 条目 ID 筛选')
  .action(async (options, context) => {
    const { system } = context.data;
    return await system.pushSubjects({ name: options.name, bgm: options.bgm });
  });

app
  .command('pull', {
    summary: '将存储中的文件状态同步到本地数据库',
    text: '扫描已有文件并更新本地记录，不下载文件到本地。未指定筛选条件时处理所有已启用条目。',
    examples: [{ command: 'anime pull', comment: '刷新所有已启用订阅的存储状态' }]
  })
  .option('-n, --name <string>', '按动画条目名称包含的文本筛选')
  .option('--bgm <id>', '按 Bangumi 条目 ID 筛选')
  .action(async (options, context) => {
    const { system } = context.data;
    return await system.pullSubjects({ name: options.name, bgm: options.bgm, checksum: false });
  });

app
  .command('download', { summary: '[WIP] 下载资源', text: '尚未实现，当前不会执行下载。' })
  .argument('<url>', '资源下载链接')
  .action(async (url, options, context) => {
    const { system } = context.data;
  });

const subject = app
  .group('subject', {
    summary: '查看订阅条目的资源与文件',
    text: '通过 --name 或 --bgm 选择已配置的动画条目。名称匹配时使用第一个匹配条目。',
    examples: [{ command: 'anime subject resources --name "葬送的芙莉莲"' }]
  })
  .option('-n, --name <string>', '匹配条目名称或资源搜索词；优先于 --bgm')
  .option('--bgm <id>', '选择指定 Bangumi ID 的条目');

subject
  .command('upload', {
    summary: '[WIP] 手动上传动画资源',
    text: '尚未实现，当前不会执行上传。'
  })
  .option('-i, --input <file>', '待上传文件')
  .option('--url', 'Anime Garden 链接, 磁力链接, 种子链接')
  .action(async (options, context) => {
    const { system } = context.data;
    const subject = await getSubject(system, options);

    // TODO
  });

subject
  .command('resources', {
    summary: '显示订阅条目的动画资源',
    text: '默认显示筛选、提取后的资源及目标文件名。使用 --full 查看提取前已解析的完整资源列表。',
    examples: [
      { command: 'anime subject resources --name "葬送的芙莉莲"' },
      {
        command: 'anime subject resources --name "葬送的芙莉莲" --full --json',
        comment: '检查完整资源数据'
      }
    ]
  })
  .option('--full', '显示提取前已解析的完整资源列表')
  .option('--json', '输出 JSON 格式')
  .action(async (options, context) => {
    const { system } = context.data;
    const subject = await getSubject(system, options);
    const resources = await subject.fetchResources();
    if (options.full) {
      printParsedResources(system, subject, resources, options);
      return resources;
    } else {
      const extracted = await subject.extractResources(resources);
      printExtractedResources(system, subject, extracted, options);
      return extracted;
    }
  });

subject
  .command('files', {
    summary: '[WIP] 显示动画资源目录',
    text: '尚未实现。可使用 anime storage list 查看存储目录。'
  })
  .option('--json', '输出 JSON 格式')
  .action(async (options, context) => {
    const { system } = context.data;
    const subject = await getSubject(system, options);

    // TODO
  });

// garden
const garden = app.group('garden', {
  summary: '搜索 Anime Garden 动画资源',
  text: '默认子命令为 search，可直接使用 anime garden <关键词>。',
  examples: [
    { command: 'anime garden "葬送的芙莉莲" --limit 10' },
    { command: 'anime garden search --help', comment: '查看搜索条件' }
  ]
});

garden
  .command('search', {
    summary: '搜索动画资源',
    text: '按关键词查询 Anime Garden，优先使用可用缓存。未提供关键词时仅按其他筛选条件查询。',
    examples: [
      { command: 'anime garden search "葬送的芙莉莲" --limit 10' },
      {
        command: 'anime garden search --type 动画 --after 2026-10-01 --refresh --json',
        comment: '刷新缓存并输出筛选结果'
      }
    ]
  })
  .alias('')
  .argument('[...text]', '搜索关键词，可传多个；含空格的关键词请加引号')
  .option('--type <type>', '按资源类型过滤，例如：动画')
  .option('--after <date>', '资源上传时间起点，例如：2026-10-01')
  .option('--before <date>', '资源上传时间终点，例如：2026-11-01')
  .option('--limit <count>', '最多展示的资源数量，默认：20；同样适用于 --json')
  .option('--refresh', '强制刷新缓存')
  .option('--json', '输出 JSON 格式')
  .action(async (texts, options, context) => {
    return await searchResources(context.data.system, texts, options);
  });

garden
  .command('detail', { summary: '[WIP] 显示资源详情', text: '尚未实现，当前不会查询详情。' })
  .argument('<provider>', '资源来源站点标识')
  .argument('<id>', '来源站点中的资源 ID')
  .option('--json', '输出 JSON 格式')
  .action(async () => {});

garden
  .command('collection', {
    summary: '[WIP] 导入 Anime Garden 收藏夹',
    text: '尚未实现，当前不会导入收藏夹。'
  })
  .argument('<id>', 'Anime Garden 收藏夹 ID')
  .option('--json', '输出 JSON 格式')
  .action(async () => {});

// bangumi
const bangumi = app.group('bangumi', {
  summary: '搜索 Bangumi 条目并导出用户收藏',
  examples: [
    { command: 'anime bangumi search "葬送的芙莉莲"' },
    { command: 'anime bangumi collection --uid your-name --dump' }
  ]
});

bangumi
  .command('search', {
    summary: '搜索 Bangumi 动画条目',
    text: '输出可用于订阅配置的条目数据。匹配多条结果时需要在交互终端中选择，--json 不会跳过此选择。',
    examples: [{ command: 'anime bangumi search "葬送的芙莉莲" --json' }]
  })
  .argument('<text>', '动画名称或搜索关键词；含空格时请加引号')
  .option('--json', '输出 JSON 格式')
  .action(async (text, options, context) => {
    return await searchBangumi(context.data.system, text, options);
  });

bangumi
  .command('subject', {
    summary: '[WIP] 显示 Bangumi 条目详情',
    text: '尚未实现，当前不会查询详情。'
  })
  .argument('<id>', 'Bangumi 条目 ID')
  .option('--json', '输出 JSON 格式')
  .action(async () => {
    // TODO
  });

bangumi
  .command('collection', {
    summary: '读取 Bangumi 用户收藏并生成订阅配置',
    text: '默认读取“在看”收藏并展示结果，使用 --dump 写入文件。日期筛选依据动画开播日期；导出时不会覆盖已有文件。',
    examples: [
      {
        command: 'anime bangumi collection --uid your-name --dump',
        comment: '保存到配置目录的 collections/YYYY-MM.yaml'
      },
      {
        command:
          'anime bangumi collection --status wish --after 2026-10-01 --dump collections/autumn.yaml',
        comment: '使用 anime.yaml 中的 bangumi.uid，并指定导出文件'
      },
      {
        command: 'anime bangumi collection --uid your-name --json',
        comment: '仅输出收藏数据，不写入文件'
      }
    ]
  })
  .option('--uid <uid>', 'Bangumi 用户 ID 或用户名；默认读取 anime.yaml 的 bangumi.uid')
  .option('--status <type>', '收藏类型：doing（默认）/wish/collect/on_hold/dropped')
  .option('--after <date>', '按开播日期筛选起点，例如：2026-10-01')
  .option('--before <date>', '按开播日期筛选终点，例如：2026-12-31')
  .option(
    '--dump [file]',
    '写入订阅文件；省略路径时为 collections/YYYY-MM.yaml，相对路径基于配置目录'
  )
  .option('--json', '输出 JSON 格式')
  .action(async (options, context) => {
    return await importBangumiCollection(context.data.system, options);
  });

// storage
const storage = app
  .group('storage', {
    summary: '列出、上传、下载和管理存储文件',
    text: '存储路径相对于所选存储的根目录，不接受绝对路径或 ..。\n本地输入、输出路径相对于当前工作目录，不受 --dir 影响。',
    examples: [
      { command: 'anime storage list -s default' },
      { command: 'anime storage get "动画/01.mkv" -o ./01.mkv' }
    ]
  })
  .option('-s, --storage <name>', 'anime.yaml 中配置的存储名称，默认：default');

storage
  .command('list', {
    summary: '列出存储目录内容',
    examples: [
      { command: 'anime storage list', comment: '列出默认存储根目录' },
      { command: 'anime storage ls "动画" -s default --json' }
    ]
  })
  .alias('ls')
  .argument('[file]', '相对于存储根目录的路径；省略时列出根目录')
  .option('--json', '输出 JSON 格式')
  .action(async (file, options, context) => {
    await context.data.system.validateStorage();
    return await listStorage(context.data.system, file, options);
  });

storage
  .command('get', {
    summary: '从存储下载文件到本地',
    examples: [{ command: 'anime storage get "动画/01.mkv" -o ./01.mkv' }]
  })
  .argument('<file>', '待下载文件的路径，相对于存储根目录')
  .option('-o, --output <dst>', '本地目标文件或已有目录；默认保存到当前目录，保留文件名')
  .action(async (file, options, context) => {
    return await getStorage(context.data.system, file, options);
  });

storage
  .command('put', {
    summary: '将本地文件上传到存储',
    examples: [{ command: 'anime storage put "动画/01.mkv" -i ./01.mkv' }]
  })
  .argument('<file>', '上传目标路径，相对于存储根目录')
  .option('-i, --input <src>', '本地源文件；省略时使用位置参数 file 作为本地相对路径')
  .action(async (file, options, context) => {
    return await putStorage(context.data.system, file, options);
  });

storage
  .command('remove', {
    summary: '删除存储中的文件',
    text: '直接删除指定路径，不会交互确认。',
    examples: [{ command: 'anime storage rm "动画/旧文件.mkv"' }]
  })
  .alias('rm')
  .argument('<file>', '待删除文件的路径，相对于存储根目录')
  .action(async (file, options, context) => {
    return await removeStorage(context.data.system, file, options);
  });

storage
  .command('move', {
    summary: '移动存储文件或重命名',
    text: '源与目标默认使用 --storage 指定的存储，可分别覆盖以跨存储移动。',
    examples: [
      { command: 'anime storage mv "动画/旧名称.mkv" "动画/新名称.mkv"' },
      {
        command:
          'anime storage move "动画/01.mkv" "归档/01.mkv" --src-storage default --dst-storage archive',
        comment: '移动到另一个已配置的存储'
      }
    ]
  })
  .alias('mv')
  .argument('<src>', '源文件路径，相对于源存储根目录')
  .argument('<dst>', '目标文件路径，相对于目标存储根目录')
  .option('--src-storage <driver>', '源存储名称；默认使用 --storage')
  .option('--dst-storage <driver>', '目标存储名称；默认使用 --storage')
  .action(async (src, dst, options, context) => {
    return await moveStorage(context.data.system, src, dst, options);
  });

setGlobalDispatcher(new EnvHttpProxyAgent());

await app.run(process.argv.slice(2)).catch((err) => console.error(err));
