import * as path from 'node:path';
import { remove } from 'fs-extra';

import { format } from 'date-fns';
import {
  bold,
  green,
  lightRed,
  link,
  red,
  lightGreen,
  lightBlue
} from 'kolorist';

import type { VideoInfo } from '../io';

import { context } from '../context';
import { DOT, logger, padRight } from '../logger';

import { app } from './app';
import { promptConfirm } from './utils';

app
  .command('store list [name]', 'List all uploaded video info')
  .alias('store ls')
  .action(async (name) => {
    const { useStore } = await import('../io');
    const store = await useStore('ali')();

    const videos = await store.listLocalVideos();
    videos.sort((a, b) => a.title.localeCompare(b.title));

    const filtered = videos.filter(
      (v) => !name || v.title.indexOf(name) !== -1
    );
    logger.println(
      lightGreen(
        `There are ${bold(filtered.length)} videos uploaded at ${
          store.platform
        }`
      )
    );
    printVideoInfoList(filtered);
  });

app.command('store info <id>', 'Print video info on OSS').action(async (id) => {
  const { useStore } = await import('../io');
  const store = await useStore('ali')();

  const info = await store.fetchVideoInfo(id);

  if (info) {
    printVideoInfo(info);
  } else {
    logger.println(`${red(`✗ video "${id}" not found`)}`);
  }
});

app
  .command('store put <file>', 'Upload video to OSS')
  .action(async (filename) => {
    const { useStore } = await import('../io');
    const store = await useStore('ali')();

    try {
      const info = await store.upload(path.resolve(filename));
      if (info) {
        printVideoInfo(info);
      } else {
        throw new Error();
      }
    } catch (error) {
      logger.empty();
      logger.println(`${red('✗ Fail')} uploading ${filename}`);
    }
  });

app
  .command('store remove [...ids]', 'Remove video info on OSS')
  .alias('store rm')
  .option('--local', 'Remove local videos')
  .action(async (ids, option) => {
    const { useStore } = await import('../io');
    const store = await useStore('ali')();

    const removeVideo = async (id: string, info: VideoInfo | undefined) => {
      logger.empty();
      if (info) {
        printVideoInfo(info);
        await store.deleteVideo(info.videoId);
        logger.println(`${green(`✓ Delete    ${info.videoId}`)}`);
      } else {
        logger.println(`${red(`✗ Video     ${id} is not found`)}`);
      }

      if (option.local && info?.source.directory) {
        const filepath = context.decodePath(info?.source.directory, info.title);
        await remove(filepath);
        logger.println(`${green(`✓ Delete    ${filepath}`)}`);
      }
    };

    if (ids.length > 0) {
      for (const id of ids) {
        const info = await store.fetchVideoInfo(id);
        await removeVideo(id, info);
      }
    } else {
      logger.println(lightBlue('  Init admin client'));

      const { AdminClient } = await import('../client');
      const client = await AdminClient.init();
      const onairs = client.onair.flatMap((o) => o.episodes);
      const videoIds = new Set<string>();
      for (const onair of onairs) {
        if ('storage' in onair) {
          if (onair.storage.type === store.platform) {
            videoIds.add(onair.storage.videoId);
          }
        }
      }
      const videos = (await store.listLocalVideos()).filter(
        (v) => !videoIds.has(v.videoId)
      );

      if (videos.length > 0) {
        logger.println(
          lightRed(`✓ There are ${bold(videos.length)} videos to be removed`)
        );
        printVideoInfoList(videos);

        if (
          await promptConfirm(
            `Are you sure to remove these ${videos.length} videos`
          )
        ) {
          for (const video of videos) {
            await removeVideo(video.videoId, video);
          }
        }
      } else {
        logger.println(lightGreen(`✓ There are no videos to be removed`));
      }
    }
  });

app.command('video info <file>', 'Check video info').action(async (file) => {
  const { getVideoInfo } = await import('../io/video');
  const info = await getVideoInfo(file);
  console.log(JSON.stringify(info, null, 2));
});

function printVideoInfoList(videos: VideoInfo[]) {
  const titles: string[] = [];
  const ids: string[] = [];
  for (const info of videos) {
    titles.push(`${info.title}`);
    ids.push(`(${link(info.videoId, info.playUrl[0])})`);
  }

  const padded = padRight(titles);
  for (let i = 0; i < padded.length; i++) {
    logger.println(`${DOT} ${padded[i]}  ${ids[i]}`);
  }
}

function printVideoInfo(videoInfo: VideoInfo) {
  logger.println(`${bold('Platform')}    ${videoInfo.platform}`);
  logger.println(`${bold('VideoId')}     ${videoInfo.videoId}`);
  logger.println(`${bold('Title')}       ${videoInfo.title}`);
  logger.println(
    `${bold('Created at')}  ${format(
      new Date(videoInfo.createdAt),
      'yyyy-MM-dd HH:mm:ss'
    )}`
  );
  if (videoInfo.playUrl.length === 1) {
    logger.println(`${bold('Play URL')}    ${videoInfo.playUrl[0]}`);
  } else {
    logger.println(`${bold('Play URL')}`);
    for (const url of videoInfo.playUrl) {
      logger.tab.println(`${url}`);
    }
  }
}
