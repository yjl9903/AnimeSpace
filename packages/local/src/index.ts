import {
  type AnimeSystem,
  getEpisodeType,
  isValidEpisode,
  listIncludeFiles,
  type LocalFile,
  type LocalVideo,
  parseEpisode,
  type Plugin,
  type PluginEntry
} from '@animespace/core';

import { fs as LocalFS } from 'breadfs/node';
import { memo } from 'memofunc';
import { parse } from 'anitomy';
import { bold, dim, lightBlue, lightGreen, lightYellow } from '@breadc/color';

const DOT = dim('•');

export const LOCAL = 'Local';

export interface LocalOptions extends PluginEntry {
  directory?: string;

  introspect?: boolean;

  refresh?: boolean;
}

export async function Local(options: LocalOptions): Promise<Plugin> {
  const createLogger = memo((system: AnimeSystem) =>
    system.logger.withTag(LOCAL)
  );

  const files: LocalFile[] = [];

  return {
    name: 'local',
    options,
    introspect: {
      async handleUnknownFile(system, anime, file) {
        if (options.introspect === false) return;

        const logger = createLogger(system);
        const result = parse(file.filename);
        if (result) {
          const video: LocalVideo = {
            filename: anime.formatFilename({
              fansub: result.release.group,
              episode: result.episode.number,
              extension: result.file.extension
            }),
            naming: 'auto',
            fansub: result.release.group,
            episode: result.episode.number,
            source: {
              type: LOCAL,
              from: file.filename
            }
          };
          logger.info(
            `${lightGreen('Moving local file')} ${
              bold(
                file.filename
              )
            } to ${bold(video.filename)}`
          );
          await anime.addVideoByMove(file.path.path, video);
          return video;
        }
        return undefined;
      }
    },
    refresh: {
      async prepare(system) {
        const relDir = LocalFS.path(
          system.space.root,
          options.directory ?? './local'
        );

        files.splice(
          0,
          files.length,
          ...(await listIncludeFiles(system.space, relDir))
        );

        if (files.length > 0) {
          const logger = createLogger(system);
          logger.info(
            `There are ${lightYellow(`${files.length} local files`)} found.`
          );
          for (const f of files) {
            logger.info(`${DOT} ${f.filename}`);
          }
        }
      },
      async refresh(system, anime) {
        if (options.refresh === false) return;

        const logger = createLogger(system);
        const relatedFiles: LocalFile[] = [];
        files.splice(
          0,
          files.length,
          ...files.filter(f => {
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
          const result = parseEpisode(anime, file.filename);
          if (result && isValidEpisode(result)) {
            const filename = anime.formatFilename({
              type: getEpisodeType(result),
              fansub: result.parsed.release.group,
              episode: result.parsed.episode.number,
              extension: result.parsed.file.extension
            });
            // Hack: check the format filename is valid
            if (filename.includes('{fansub}' || '{episode}' || '{season}')) {
              continue;
            }

            const video: LocalVideo = {
              filename,
              naming: 'auto',
              fansub: result.parsed.release.group,
              episode: result.parsed.episode.number,
              source: {
                type: LOCAL,
                from: file.filename
              }
            };
            logger.info(
              `${lightBlue('Moving local file')} ${
                bold(
                  file.filename
                )
              } to ${bold(video.filename)}`
            );
            await anime.addVideoByMove(file.path.path, video);
          } else {
            logger.info(lightYellow(`Parse "${bold(file.filename)}" failed`));
          }
        }
      },
      async finish(system) {}
    }
  };
}
