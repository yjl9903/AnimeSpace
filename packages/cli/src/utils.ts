import type { VideoInfo } from './types';

import fs from 'fs-extra';
import crypto from 'node:crypto';

import { bold } from 'kolorist';

export function printVideoInfo(videoInfo: VideoInfo) {
  console.log(`  ${bold('VideoId')}     ${videoInfo.videoId}`);
  console.log(`  ${bold('Title')}       ${videoInfo.title}`);
  console.log(`  ${bold('Created at')}  ${videoInfo.creationTime}`);
  console.log(`  ${bold('Play URL')}`);
  for (const url of videoInfo.playUrl) {
    console.log(`    ${url}`);
  }
}

export function hashFile(filepath: string): string {
  const fileBuffer = fs.readFileSync(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}
