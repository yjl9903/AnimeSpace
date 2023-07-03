export interface LocalLibrary {
  title: string;

  date: Date;

  season?: number;

  videos: LocalVideo[];
}

export interface LocalVideo {
  filename: string;

  naming: 'auto' | 'manual';

  fansub?: string;

  episode?: number;

  source: LocalVideoSource;
}

export interface LocalVideoSource extends Record<string, any> {
  type: string;
}

export interface LocalFile {
  filename: string;

  path: string;

  metadata: Record<string, string>;
}