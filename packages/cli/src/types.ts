export interface CliOption {}

export interface ResolvedOption {}

export interface VideoInfo {
  store: 'ali';

  videoId: string;

  title: string;

  creationTime: string;

  cover: string;

  playUrl: string[];
}

export interface LocalVideoInfo extends VideoInfo {
  filepath: string;

  hash: string;
}
