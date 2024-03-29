import type { Path } from 'breadfs';

import type { AnimePlanType } from '../plan';

export interface LocalLibrary {
  title: string;

  storage: string;

  videos: LocalVideo[];
}

export interface LocalVideo {
  filename: string;

  naming: 'auto' | 'manual';

  type?: AnimePlanType;

  fansub?: string;

  date?: Date;

  season?: number;

  episode?: number;

  source: LocalVideoSource;
}

export interface LocalVideoSource extends Record<string, any> {
  type: string;
}

export interface LocalFile {
  filename: string;

  path: Path;

  metadata: Record<string, string>;
}

export interface FormatOptions {
  type: string;

  season: number;

  episode: number;

  fansub: string;

  extension: string;
}
