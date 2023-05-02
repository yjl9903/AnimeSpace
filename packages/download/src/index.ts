import {
  type Plugin,
  type PluginEntry,
  type LocalFile,
  type LocalVideo,
  listIncludeFiles
} from '@animespace/core';

import { parse } from 'anitomy';

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
        for (const file of relatedFiles) {
          const result = parse(file.filename);
          if (result) {
            const video: LocalVideo = {
              filename: anime.formatFilename(result),
              source: {
                type: 'download',
                from: file.filename
              }
            };
            await anime.moveVideo(file, video);
          } else {
            // Log warning
          }
        }
      },
      async finish(system) {
        if (files.length > 0) {
        }
      }
    }
  };
}
