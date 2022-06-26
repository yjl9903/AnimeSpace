import { promises as fsPromises } from 'fs-extra';
import MediaInfoFactory, { ReadChunkFunc, Result } from 'mediainfo.js';

export async function getVideoInfo(filepath: string) {
  const mediaInfo = await MediaInfoFactory();
  let fileHandle: fsPromises.FileHandle | undefined = undefined;
  let fileSize: number = 0;

  const readChunk: ReadChunkFunc = async (size, offset) => {
    const buffer = new Uint8Array(size);
    await fileHandle!.read(buffer, 0, size, offset);
    return buffer;
  };

  try {
    fileHandle = await fsPromises.open(filepath, 'r');
    fileSize = (await fileHandle.stat()).size;
    const result = (await mediaInfo.analyzeData(
      () => fileSize,
      readChunk
    )) as Result;
    if (typeof result === 'object') {
      const track = result.media.track;
      return {
        general: track.find((t) => t['@type'] === 'General')!,
        video: track.find((t) => t['@type'] === 'Video')!,
        audio: track.find((t) => t['@type'] === 'Audio')!
      };
    } else {
      throw new Error('Unreachable');
    }
  } catch (err) {
    throw err;
  } finally {
    fileHandle && (await fileHandle.close());
    mediaInfo && mediaInfo.close();
  }
}

export async function checkVideo(filepath: string) {
  const info = await getVideoInfo(filepath);
  return info.general?.Format !== 'Matroska' && info.video?.Format === 'HEVC';
}
