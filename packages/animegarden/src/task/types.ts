import type { Resource } from 'animegarden';

import type { LocalVideo } from '@animespace/core';

export type Task = {
  video: LocalVideo;
  resource: Pick<
    Resource<{ magnet: string }>,
    'title' | 'magnet' | 'href' | 'provider' | 'providerId'
  >;
};
