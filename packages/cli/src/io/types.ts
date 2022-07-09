import type {
  VideoSource,
  VideoInfo as BaseVideoInfo
} from '@animepaste/database';

export type VideoStorePlatform = 'ali';

export type VideoInfo = BaseVideoInfo<VideoStorePlatform>;

export { VideoSource };
