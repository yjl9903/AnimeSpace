import { bold } from '@breadc/color';

import type { Plan } from '../space';

import type { AnimeSystem } from './types';

import { Anime, LocalFile, LocalVideo } from './anime';

export async function introspect(system: AnimeSystem) {
  const logger = system.logger.withTag('introspect');
  logger.info(`Introspect Anime Space`);

  for (const plugin of system.space.plugins) {
    await plugin.introspect?.prepare?.(system);
  }

  const animes = await loadAnime(system, false);
  for (const anime of animes) {
    await introspectAnime(system, anime);
  }

  for (const plugin of system.space.plugins) {
    await plugin.introspect?.finish?.(system);
  }

  logger.info(`Introspect Anime Space OK`);
  return animes;
}

async function introspectAnime(system: AnimeSystem, anime: Anime) {
  const lib = await anime.library();
  const videos = lib.videos;
  const files = await anime.list();

  const unknownFiles: LocalFile[] = [];
  const unknownVideos: LocalVideo[] = [];

  {
    const set = new Set(videos.map((v) => v.filename));
    for (const file of files) {
      if (!set.has(file.filename)) {
        unknownFiles.push(file);
      }
    }
  }
  {
    const set = new Set(files.map((v) => v.filename));
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
      logger.info(`Removing "${bold(video.filename)}"`);
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
  // Sync episode / fansub
  for (const video of videos) {
    const filename = anime.reformatVideoFilename(video);
    if (filename !== video.filename) {
      logger.info(`Moving "${bold(video.filename)}" to "${bold(filename)}"`);
      await anime.moveVideo(video, filename);
    }
  }
}

export async function loadAnime(system: AnimeSystem, all: boolean = false) {
  const plans = (await system.space.plans()).filter(
    (p) => all || p.state === 'onair'
  );
  const animePlans = flatAnimePlan(plans);
  const animes = animePlans.map((ap) => new Anime(system.space, ap));
  // Parallel list directory and get metadata
  await Promise.all(animes.flatMap((a) => [a.library(), a.list()]));
  return animes;
}

export function flatAnimePlan(plans: Plan[]) {
  return plans.flatMap((p) => p.onair);
}
