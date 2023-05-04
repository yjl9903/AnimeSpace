import { ConsolaInstance } from 'consola';
import {
  type Plugin,
  type PluginEntry,
  type LocalFile,
  type LocalVideo,
  type AnimeSystem,
  listIncludeFiles
} from '@animespace/core';

import { parse } from 'anitomy';
import { dim, bold, lightYellow, lightGreen } from '@breadc/color';

const DOT = dim('•');

export const DOWNLOAD = 'Download';

export interface DownloadOptions extends PluginEntry {
  directory?: string;
}

export async function Download(options: DownloadOptions): Promise<Plugin> {
  let _logger: ConsolaInstance | undefined = undefined;
  const relDir = options.directory ?? './download';
  const files: LocalFile[] = [];

  return {
    name: 'download',
    introspect: {
      async handleUnknownFile(system, anime, file) {
        const logger = createLogger(system);
        const result = parse(file.filename);
        if (result) {
          const video: LocalVideo = {
            filename: anime.formatFilename(result),
            fansub: result.release.group,
            episode: result.episode.number,
            source: {
              type: DOWNLOAD,
              from: file.filename
            }
          };
          logger.info(
            `${lightGreen('Moving downloaded file')} ${bold(
              file.filename
            )} to ${bold(video.filename)}`
          );
          await anime.addVideo(file, video);
          return video;
        }
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
        const logger = createLogger(system);
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
              fansub: result.release.group,
              episode: result.episode.number,
              source: {
                type: DOWNLOAD,
                from: file.filename
              }
            };
            logger.info(
              `${lightGreen('Moving downloaded file')} ${bold(
                file.filename
              )} to ${bold(video.filename)}`
            );
            await anime.addVideo(file, video);
          } else {
            logger.info(lightYellow(`Parse "${bold(file.filename)}" failed`));
          }
        }
      },
      async finish(system) {
        if (files.length > 0) {
          const logger = createLogger(system);
          logger.info(
            `There are ${lightYellow(
              `${files.length} downloaded files`
            )} without matching animations found.`
          );
          for (const f of files) {
            logger.info(`${DOT} ${f.filename}`);
          }
        }
      }
    }
  };

  function createLogger(system: AnimeSystem) {
    if (_logger) {
      return _logger;
    } else {
      return (_logger = system.logger.withTag(DOWNLOAD));
    }
  }
}
