import type { VideoInfo } from './io';

import fs from 'fs-extra';
import crypto from 'node:crypto';

import { bold } from 'kolorist';
import { ImmutableMap, MutableMap } from 'lbear';

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

export async function hashFile(filepath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function groupBy<T>(
  items: T[],
  fn: (arg: T) => string
): ImmutableMap<string, T[]> {
  const map = MutableMap.empty<string, T[]>();
  for (const item of items) {
    const key = fn(item);
    map.getOrPut(key, () => []).push(item);
  }
  return map.toImmutable();
}

function calcLength(text: string) {
  const RE = /[\u4e00-\u9fa5]/;
  let sum = 0;
  for (const c of text) {
    sum += RE.test(c) ? 2 : 1;
  }
  return sum;
}

export function padRight(texts: string[], fill = ' '): string[] {
  const length = texts
    .map((t) => calcLength(t))
    .reduce((max, l) => Math.max(max, l), 0);
  return texts.map((t) => t + fill.repeat(length - calcLength(t)));
}
