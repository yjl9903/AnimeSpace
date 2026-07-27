import { afterEach, describe, expect, it, vi } from 'vitest';

import type { System } from '../src/system/system.ts';
import type { DownloadRequest } from '../src/download/torrent.ts';

import { QbittorrentDownloader } from '../src/download/qbittorrent/index.ts';
import { DownloadTicketStatus } from '../src/download/torrent.ts';
import { DEFAULT_QBITTORRENT_SHARE_LIMITS } from '../src/download/qbittorrent/const.ts';

function createDownloader(client: Record<string, ReturnType<typeof vi.fn>>) {
  const system = {
    space: {
      downloader: {
        qbittorrent: {
          url: 'http://localhost:9091/api/v2',
          category: 'animespace',
          concurrency: 3,
          savePath: '/tmp/animespace-download'
        }
      }
    },
    logger: {
      log: vi.fn(),
      error: vi.fn()
    }
  } as unknown as System;

  const downloader = new QbittorrentDownloader(system);
  vi.spyOn(downloader, 'initialize').mockResolvedValue();
  Object.assign(downloader, { client });
  return downloader;
}

function createRequest(infoHash = 'abc123'): DownloadRequest {
  return {
    infoHash,
    magnet: `magnet:?xt=urn:btih:${infoHash}`,
    subject: {},
    resource: {}
  } as DownloadRequest;
}

function torrent(
  overrides: Partial<{
    hash: string;
    category: string;
    ratio_limit: number;
    seeding_time_limit: number;
    inactive_seeding_time_limit: number;
  }> = {}
) {
  return {
    hash: 'abc123',
    category: 'animespace',
    ratio_limit: DEFAULT_QBITTORRENT_SHARE_LIMITS.ratioLimit,
    seeding_time_limit: DEFAULT_QBITTORRENT_SHARE_LIMITS.seedingTimeLimit,
    inactive_seeding_time_limit: DEFAULT_QBITTORRENT_SHARE_LIMITS.inactiveSeedingTimeLimit,
    ...overrides
  };
}

function inheritedTorrent() {
  return torrent({
    ratio_limit: -2,
    seeding_time_limit: -2,
    inactive_seeding_time_limit: -2
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('QbittorrentDownloader share limits', () => {
  it('waits until a newly added torrent is visible and verifies its share limits', async () => {
    const client = {
      getTorrentList: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([inheritedTorrent()])
        .mockResolvedValueOnce([torrent()]),
      addNewMagnet: vi.fn().mockResolvedValue(true),
      setTorrentShareLimits: vi.fn().mockResolvedValue(true),
      setTorrentCategory: vi.fn()
    };
    const downloader = createDownloader(client);

    const tickets = await downloader.ensureQueued([createRequest()]);

    expect(client.addNewMagnet).toHaveBeenCalledOnce();
    expect(client.setTorrentShareLimits).toHaveBeenCalledWith(
      'abc123',
      DEFAULT_QBITTORRENT_SHARE_LIMITS
    );
    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.status).toBe(DownloadTicketStatus.created);
  });

  it('repairs share limits for an existing torrent', async () => {
    const client = {
      getTorrentList: vi
        .fn()
        .mockResolvedValueOnce([inheritedTorrent()])
        .mockResolvedValueOnce([inheritedTorrent()])
        .mockResolvedValueOnce([torrent()]),
      addNewMagnet: vi.fn(),
      setTorrentShareLimits: vi.fn().mockResolvedValue(true),
      setTorrentCategory: vi.fn()
    };
    const downloader = createDownloader(client);

    const tickets = await downloader.ensureQueued([createRequest()]);

    expect(client.addNewMagnet).not.toHaveBeenCalled();
    expect(client.setTorrentShareLimits).toHaveBeenCalledWith(
      'abc123',
      DEFAULT_QBITTORRENT_SHARE_LIMITS
    );
    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.status).toBe(DownloadTicketStatus.existing);
  });

  it('does not reconfigure an existing torrent with matching share limits', async () => {
    const client = {
      getTorrentList: vi.fn().mockResolvedValue([torrent()]),
      addNewMagnet: vi.fn(),
      setTorrentShareLimits: vi.fn(),
      setTorrentCategory: vi.fn()
    };
    const downloader = createDownloader(client);

    const tickets = await downloader.ensureQueued([createRequest()]);

    expect(client.getTorrentList).toHaveBeenCalledOnce();
    expect(client.setTorrentShareLimits).not.toHaveBeenCalled();
    expect(tickets[0]?.status).toBe(DownloadTicketStatus.existing);
  });

  it('fails a ticket when share limits cannot be verified', async () => {
    vi.useFakeTimers();
    const client = {
      getTorrentList: vi.fn().mockResolvedValueOnce([]).mockResolvedValue([inheritedTorrent()]),
      addNewMagnet: vi.fn().mockResolvedValue(true),
      setTorrentShareLimits: vi.fn().mockResolvedValue(true),
      setTorrentCategory: vi.fn()
    };
    const downloader = createDownloader(client);

    const pending = downloader.ensureQueued([createRequest()]);
    await vi.runAllTimersAsync();
    const tickets = await pending;

    expect(tickets[0]?.status).toBe(DownloadTicketStatus.failed);
  });
});
