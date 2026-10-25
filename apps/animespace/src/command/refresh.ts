import { eq } from 'drizzle-orm';
import { bold, dim, lightBlue, lightGreen, lightRed, lightYellow, link } from 'breadc';

import type { Subject } from '../subject/subject.ts';
import type { System, PushOptions, PullOptions } from '../system/system.ts';

import { splitArray } from '../utils/array.ts';
import { getInfoHash } from '../utils/torrent.ts';
import { getSourceURL, nameResource } from '../subject/source/extract.ts';
import { DownloadRequest } from '../download/torrent.ts';
import { subjectFiles as subjectFilesSchema } from '../sqlite/subject.ts';

import { printList } from './tui.ts';
import { printSource } from './subject.ts';

export async function pushSubjects(system: System, subjects: Subject[], options: PushOptions = {}) {
  const tasks: Array<{ subject: Subject; promises: Promise<void>[] }> = [];

  try {
    system.logger.log(lightBlue('开始推送 Anime Space 更新'));
    system.logger.log();

    await system.initializeSource();

    for (const subject of subjects) {
      const task = await pushSubject(subject);
      if (task) {
        tasks.push(task);
      }
    }

    system.logger.log(lightGreen(`抓取动画资源完成`));
    system.logger.log();
  } catch (error) {
    system.logger.log(lightRed('推送 Anime Space 更新失败'));
    system.logger.error(error);
    system.logger.log();
  }

  return tasks;
}

export async function pullSubjects(system: System, subjects: Subject[], options: PullOptions = {}) {
  try {
    system.logger.log(lightBlue('开始同步 Anime Space 存储快照'));
    system.logger.log();

    await system.initializeSource();

    for (const subject of subjects) {
      await pullSubject(subject, options);
    }

    system.logger.log(lightGreen('成功同步 Anime Space 存储快照'));
    system.logger.log();
  } catch (error) {
    system.logger.log(lightRed('同步存储 Anime Space 快照失败'));
    system.logger.error(error);
    system.logger.log();

    throw error;
  }
}

async function pushSubject(subject: Subject) {
  const { system } = subject;

  system.logger.log(`${lightBlue('抓取资源')} ${bold(subject.name)}`);
  printSource(system, subject);

  const fetched = await subject.fetchResources();
  const extracted = await subject.extractResources(fetched);
  const [downloaded, toDownload] = splitArray(extracted, (r) => !!r.subjectFiles);
  const syncing = downloaded.map((downloaded) =>
    system.managers.storage.syncFileName(subject, downloaded)
  );
  system.logger.log(
    `${dim('存储快照')} 已下载 ${downloaded.length} 条资源 (${link(`已抓取 ${extracted.length} 条`, getSourceURL(subject) || '')})`
  );

  if (toDownload.length > 0) {
    const requests: DownloadRequest[] = [];
    for (const res of toDownload) {
      if (res.magnet) {
        system.logger.log(`${lightYellow('开始下载')} ${link(res.extracted.filename, res.url)}`);
        requests.push({
          infoHash: getInfoHash(res.magnet),
          magnet: res.magnet,
          subject,
          resource: res
        });
      } else {
        system.logger.log(`${lightRed('未知资源')} ${link(res.extracted.filename, res.url)}`);
      }
    }

    system.logger.log();

    return {
      subject,
      promises: [
        ...syncing,
        (async () => {
          // 1. Submit torrents to downloader
          const tickets = await system.managers.downloader.submit(requests);

          const uploading: Promise<void>[] = [];

          for await (const event of system.managers.downloader.waitForSubject(subject)) {
            uploading.push(
              (async () => {
                // 2. Wait for torrents downloaded
                const ticket = tickets.find((t) => t.infoHash === event.infoHash);
                const detail = await system.managers.downloader.getTorrentDetail(event.infoHash);
                if (!ticket || !detail || detail.files.length === 0) {
                  system.logger.log(`${lightRed('未知种子')} ${event.infoHash}`);
                  return;
                }
                // 3. Upload files
                try {
                  await system.managers.storage.uploadTorrent(subject, ticket.resource, detail);
                } catch (error) {
                  system.logger.error(error);
                }
              })()
            );
          }

          await Promise.all(uploading);
        })()
      ]
    };
  } else if (syncing.length > 0) {
    system.logger.log();

    return {
      subject,
      promises: syncing
    };
  } else {
    system.logger.log();
  }
}

async function pullSubject(subject: Subject, options: PullOptions) {
  const { system } = subject;

  system.logger.log(`${lightBlue('同步快照')} ${bold(subject.name)}`);
  printSource(system, subject);
  const fetched = (await subject.fetchResources().catch(() => undefined))?.map((res) =>
    nameResource(subject, res)
  );
  const extracted = fetched ? await subject.extractResources(fetched) : undefined;
  if (fetched === undefined || extracted === undefined) {
    system.logger.log(`${lightRed('抓取失败')} ${getSourceURL(subject)}`);
    system.logger.log();
    return;
  } else {
    system.logger.log(
      `${lightBlue('成功抓取')} ${link(`共 ${fetched.length} 条资源`, getSourceURL(subject) || '')}`
    );
  }

  const subjectId = (await subject.getSubject()).id;
  const subjectFiles = (await subject.getSubjectFiles()).filter(
    (file) => file.storage === subject.storage.driver
  );
  const listedPaths = new Set<string>();

  const storage = subject.getStorage();
  const storageFiles = (
    await storage.list().catch((cause) => {
      if (isMissingStorageDirectory(cause, storage.path)) {
        // The folder was never created. Sync it as an empty snapshot and keep going.
        system.logger.log(
          `${lightYellow('存储目录不存在')} ${storage.fs.name}://${storage.path}，按空快照继续`
        );
        return [];
      }

      // A failed read is not an empty directory: keep the existing snapshots.
      throw new Error(`读取存储目录失败 ${storage.fs.name}://${storage.path}`, { cause });
    })
  ).filter((file) => {
    if (!['.mp4', '.mkv', '.ass'].includes(file.extname) || listedPaths.has(file.path)) {
      return false;
    }
    listedPaths.add(file.path);
    return true;
  });

  system.logger.log(
    `${lightBlue('快照状态')} 本地已同步 ${subjectFiles.length} 个文件 (共 ${storageFiles.length} 个文件)`
  );

  const database = await system.openDatabase();

  for (const subjectFile of subjectFiles) {
    if (!storageFiles.some((storageFile) => subjectFile.path === storageFile.path)) {
      system.logger.log(`${lightRed('删除快照')} ${subjectFile.path}`);
      await database.delete(subjectFilesSchema).where(eq(subjectFilesSchema.id, subjectFile.id));
    }
  }

  const unknown: typeof storageFiles = [];
  // Snapshot identity is storage + path, regardless of resource associations.
  const syncedPaths = new Set(subjectFiles.map((file) => file.path));

  for (const storageFile of storageFiles) {
    if (syncedPaths.has(storageFile.path)) {
      continue;
    }

    const bound =
      extracted.find((res) => storageFile.basename.startsWith(res.extracted.filename)) ||
      fetched.find((res) => storageFile.basename.startsWith(res.extracted.filename));

    if (bound) {
      const stat = await storageFile.stat();

      const inserted = await database
        .insert(subjectFilesSchema)
        .values({
          subjectId,
          storage: subject.storage.driver,
          path: storageFile.path,
          size: Number(stat.size),
          checksum: '',
          resource: { ...bound, subjectFiles: undefined },
          animegardenProvider: bound.animegarden?.provider,
          animegardenProviderId: bound.animegarden?.providerId,
          torrentInfoHash: bound.animegarden ? getInfoHash(bound.animegarden.magnet) : undefined,
          torrentFilePath: undefined
        })
        .onConflictDoNothing({ target: [subjectFilesSchema.storage, subjectFilesSchema.path] })
        .returning({ id: subjectFilesSchema.id });
      syncedPaths.add(storageFile.path);

      if (inserted.length > 0) {
        system.logger.log(
          `${lightGreen('绑定快照')} ${storageFile.path} -> ${link(bound.name, bound.url)}`
        );
      } else {
        system.logger.log(`${lightYellow('快照已存在')} ${storageFile.path}`);
      }

      continue;
    }

    unknown.push(storageFile);
  }

  system.logger.log();

  if (unknown.length > 0) {
    system.logger.log(`${lightRed('抓取文件')}`);
    printList(
      system,
      extracted,
      (item) => {
        return `${link(item.extracted.filename, item.url)}`;
      },
      (item) => {
        return `${item.extracted.filename}`;
      }
    );
    system.logger.log();

    system.logger.log(`${lightRed('未知文件')}`);
    printList(
      system,
      unknown,
      (item) => {
        return `${item.path}`;
      },
      (item) => {
        return `${item.path}`;
      }
    );
    system.logger.log();
  }
}

const NOT_FOUND_CODES = new Set(['ENOENT', 'ENOTFOUND', 'NotFound', 'NOT_FOUND']);

/**
 * Prefer a typed not-found from BreadFS (`NotFoundError`, `code`, or HTTP 404).
 * breadfs@0.1.13's BreadFSError copies `name` and `message` only, so today's
 * Aliyun / Node / WebDAV failures are still recognized by message. That
 * fallback should go away once BreadFS owns and preserves the typed signal:
 * https://github.com/yjl9903/BreadFS
 */
function isMissingStorageDirectory(error: unknown, storagePath: string): boolean {
  const seen = new Set<unknown>();
  const pending: unknown[] = [error];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (isTypedNotFound(current)) {
      return true;
    }
    if (current instanceof Error && isLegacyMissingPathMessage(current.message, storagePath)) {
      return true;
    }
    if ('cause' in current) {
      pending.push(current.cause);
    }
    if ('raw' in current) {
      pending.push(current.raw);
    }
  }

  return false;
}

function isTypedNotFound(error: object): boolean {
  if ('code' in error && typeof error.code === 'string') {
    if (NOT_FOUND_CODES.has(error.code) || error.code.startsWith('NotFound.')) {
      return true;
    }
  }
  if ('name' in error && typeof error.name === 'string' && error.name.endsWith('NotFoundError')) {
    return true;
  }
  return 'status' in error && error.status === 404;
}

function isLegacyMissingPathMessage(message: string, storagePath: string): boolean {
  const paths = new Set<string>();
  const trimmed = storagePath.replace(/\\/g, '/').replace(/\/+$/, '');
  if (trimmed && trimmed !== '/' && trimmed !== '.') {
    paths.add(trimmed);
    paths.add(storagePath);
    if (!trimmed.startsWith('/') && !/^[A-Za-z]:/.test(trimmed)) {
      paths.add(`/${trimmed}`);
    }
  }

  if ([...paths].some((path) => message === `${path} not found`)) {
    return true;
  }
  if (
    message.includes('ENOENT') &&
    [...paths].some((path) => message.includes(`'${path}'`) || message.includes(`"${path}"`))
  ) {
    return true;
  }
  return /^Invalid response: 404(?:\s|$)/.test(message);
}
