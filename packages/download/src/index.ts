import { type Plugin, type PluginEntry } from '@animespace/core';

export interface DownloadOptions extends PluginEntry {}

export function Download(options: DownloadOptions): Plugin {
  return {
    name: 'download'
  };
}
