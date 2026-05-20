export interface QbittorrentShareLimits {
  readonly ratioLimit: number;

  readonly seedingTimeLimit: number;

  readonly inactiveSeedingTimeLimit: number;
}

// Per-torrent share limits applied when AnimeSpace creates a new qBittorrent task.
export const DEFAULT_QBITTORRENT_SHARE_LIMITS: Readonly<QbittorrentShareLimits> = Object.freeze({
  ratioLimit: 1, // 分享率到 0 就算达到限制
  seedingTimeLimit: 0, // 完成后允许做种 0 分钟
  inactiveSeedingTimeLimit: 0 // 非活跃做种 0 分钟
});

export const REQUEST_TIMEOUT_MS = 10_000;

export const POLL_INTERVAL_MS = 3_000;

export const DEFAULT_CATEGORY = 'animespace';
