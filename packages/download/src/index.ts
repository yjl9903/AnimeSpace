import { type Plugin, type PluginEntry } from '@animespace/core';

export interface DownloadOptions extends PluginEntry {
  directory: string;
}

export async function Download(options: DownloadOptions): Promise<Plugin> {
  const relDir = options.directory ?? './download';

  return {
    name: 'download',
    introspect: {
      async handleUnknownFile(system, anime, file) {
        return undefined;
      }
    },
    refresh: {
      async refresh(system, anime) {}
    }
  };
}
