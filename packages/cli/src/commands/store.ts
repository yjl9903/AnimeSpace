import * as path from 'node:path';
import { remove } from 'fs-extra';

import { green, link, red } from 'kolorist';

import { context } from '../context';
import { printVideoInfo } from '../io';
import { DOT, logger, padRight } from '../logger';

import { app } from './app';

app
  .command('store list [name]', 'List all uploaded video info')
  .alias('store ls')
  .option('--one-line', 'Only show one line')
  .action(async (name, option) => {
    const { useStore } = await import('../io');
    const store = await useStore('ali')();

    const videos = await store.listLocalVideos();
    videos.sort((a, b) => a.title.localeCompare(b.title));

    const logs: string[] = [];
    const ids: string[] = [];
    for (const info of videos) {
      if (!name || info.title.indexOf(name) !== -1) {
        if (option['one-line']) {
          logs.push(info.videoId);
        } else {
          logs.push(`${info.title}`);
          ids.push(`(${link(info.videoId, info.playUrl[0])})`);
        }
      }
    }

    if (option['one-line']) {
      logger.println(logs.join(' '));
    } else {
      const padded = padRight(logs);
      for (let i = 0; i < padded.length; i++) {
        logger.println(`${DOT} ${padded[i]}  ${ids[i]}`);
      }
    }
  });

app.command('store info <id>', 'Print video info on OSS').action(async (id) => {
  const { useStore, printVideoInfo } = await import('../io');
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
    const { useStore, printVideoInfo } = await import('../io');
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

    for (const id of ids) {
      const info = await store.fetchVideoInfo(id);

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
    }
  });

app.command('video info <file>', 'Check video info').action(async (file) => {
  const { getVideoInfo } = await import('../io/video');
  const info = await getVideoInfo(file);
  console.log(JSON.stringify(info, null, 2));
});
