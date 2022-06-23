import type { VideoInfo } from './types';

import fs from 'fs-extra';
import crypto from 'node:crypto';

import { bold, link } from 'kolorist';

export function printVideoInfo(videoInfo: VideoInfo) {
  console.log(`  ${bold('VideoId')}     ${videoInfo.videoId}`);
  console.log(`  ${bold('Title')}       ${videoInfo.title}`);
  console.log(`  ${bold('Created at')}  ${videoInfo.creationTime}`);
  if (videoInfo.playUrl.length === 1) {
    console.log(`  ${bold('Play URL')}    ${videoInfo.playUrl[0]}`);
  } else {
    console.log(`  ${bold('Play URL')}`);
    for (const url of videoInfo.playUrl) {
      console.log(`    ${url}`);
    }
  }
}

export function hashFile(filepath: string): string {
  const fileBuffer = fs.readFileSync(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function bangumiLink(bgmId: string) {
  return link(`Bangumi: ${bgmId}`, 'https://bangumi.tv/subject/' + bgmId);
}
