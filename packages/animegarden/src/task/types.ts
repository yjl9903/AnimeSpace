import type { Resource } from 'animegarden';

import type { LocalVideo } from '@animespace/core';

export type Task = {
  video: LocalVideo;
  resource: Pick<
    Resource<{ tracker: true }>,
    'title' | 'magnet' | 'tracker' | 'href' | 'provider' | 'providerId'
  >;
};
