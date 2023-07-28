import { bold, lightBlue, lightGreen, lightRed } from '@breadc/color';

import type { Plan } from '../space';

import { AnimeSystemError, debug } from '../error';
import { Anime, LocalFile, LocalVideo } from '../anime';

import type { AnimeSystem, IntrospectOptions } from './types';

export async function introspect(
  system: AnimeSystem,
  options: IntrospectOptions
) {
  const logger = system.logger.withTag('introspect');
  logger.info(lightBlue(`Introspect Anime Space`));

  const animes = await system.load(options);

  for (const plugin of system.space.plugins) {
    await plugin.introspect?.prepare?.(system);
  }

  for (const anime of animes) {
    await introspectAnime(system, anime);
  }

  for (const plugin of system.space.plugins) {
    await plugin.introspect?.finish?.(system);
  }

  logger.log('');
  system.printDelta();
  logger.info(lightGreen(`Introspect Anime Space OK`));
  return animes;
}

async function introspectAnime(system: AnimeSystem, anime: Anime) {
  const lib = await anime.library();
  const videos = lib.videos;
  const files = await anime.list();

  const unknownFiles: LocalFile[] = [];
  const unknownVideos: LocalVideo[] = [];

  {
    const set = new Set(videos.map(v => v.filename));
    for (const file of files) {
      if (!set.has(file.filename)) {
        unknownFiles.push(file);
      }
    }
  }
  {
    const set = new Set(files.map(v => v.filename));
    for (const video of videos) {
      if (!set.has(video.filename)) {
        unknownVideos.push(video);
      }
    }
  }

  const logger = system.logger.withTag('introspect');

  // Handle video in metadata.yaml, but not in directory
  for (const video of unknownVideos) {
    let found = false;
    for (const plugin of system.space.plugins) {
      const handleUnknownVideo = plugin.introspect?.handleUnknownVideo;
      if (handleUnknownVideo) {
        const res = await handleUnknownVideo(system, anime, video);
        if (res) {
          found = true;
          break;
        }
      }
    }
    // Found dangling video in metadata.yaml, remove it
    if (!found) {
      logger.info(`${lightRed('Removing')} "${bold(video.filename)}"`);
      await anime.removeVideo(video);
    }
  }
  // Handle video in directory, but not in metdata.yaml
  for (const file of unknownFiles) {
    for (const plugin of system.space.plugins) {
      const handleUnknownFile = plugin.introspect?.handleUnknownFile;
      if (handleUnknownFile) {
        const video = await handleUnknownFile(system, anime, file);
        if (video) {
          break;
        }
      }
    }
  }
  // Sync generated filename
  for (const video of videos) {
    const filename = anime.reformatVideoFilename(video);
    if (filename !== video.filename) {
      logger.info(
        `${lightBlue(`Moving`)} "${bold(video.filename)}" to "${
          bold(
            filename
          )
        }"`
      );
      await anime.moveVideo(video, filename);
    }
  }
}

export async function loadAnime(
  system: AnimeSystem,
  filter: (anime: Anime) => boolean = p => p.plan.status === 'onair'
) {
  const plans = await system.space.plans();
  const animePlans = flatAnimePlan(plans);
  const animes = animePlans.map(ap => new Anime(system.space, ap));

  // Detect directory naming conflict
  {
    const set = new Set();
    for (const anime of animes) {
      if (!set.has(anime.directory)) {
        set.add(anime.directory);
      } else {
        throw new AnimeSystemError(
          `发现文件夹重名的动画 ${anime.plan.title} (Season ${anime.plan.season})`
        );
      }
    }
  }

  // Filter out finish animes
  const filtered = animes.filter(filter);
  animes.splice(0, animes.length, ...filtered);

  // Parallel list directory and get metadata
  const successed = await Promise.all(
    animes.map(async a => {
      try {
        await a.library();
        return a;
      } catch (error) {
        if (error instanceof AnimeSystemError) {
          console.error(error.message);
        } else {
          debug(error);
          console.error(`解析 ${a.plan.title} 的 metadata.yml 失败`);
        }
        return undefined;
      }
    })
  );

  return successed.filter(Boolean) as Anime[];
}

export function flatAnimePlan(plans: Plan[]) {
  return plans.flatMap(p => p.onair);
}
