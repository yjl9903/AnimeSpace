import {
  listIncludeFiles,
  type Plugin,
  type PluginEntry,
  type LocalFile
} from '@animespace/core';

export interface DownloadOptions extends PluginEntry {
  directory?: string;
}

export async function Download(options: DownloadOptions): Promise<Plugin> {
  const relDir = options.directory ?? './download';
  const files: LocalFile[] = [];

  return {
    name: 'download',
    introspect: {
      async handleUnknownFile(system, anime, file) {
        return undefined;
      }
    },
    refresh: {
      async prepare(system) {
        files.splice(
          0,
          files.length,
          ...(await listIncludeFiles(system.space, relDir))
        );
      },
      async refresh(system, anime) {
        const relatedFiles: LocalFile[] = [];
        files.splice(
          0,
          files.length,
          ...files.filter((f) => {
            if (anime.matchKeywords(f.filename)) {
              relatedFiles.push(f);
              return false;
            } else {
              return true;
            }
          })
        );
        // Add file to anime library
      },
      async finish(system) {
        if (files.length > 0) {
        }
      }
    }
  };
}
