import fs from 'fs-extra';
import path from 'pathe';

import { stringify } from 'yaml';

import {
  DefaultAnimeFormat,
  DefaultConfigFilename,
  DefaultEpisodeFormat,
  DefaultFilmFormat,
  DefaultStorageDirectory
} from './constant';
import { RawAnimeSpace } from './schema';

export async function makeNewSpace(root: string): Promise<RawAnimeSpace> {
  const space = {
    storage: {
      anime: {
        provider: 'local',
        directory: path.join(root, DefaultStorageDirectory)
      }
    },
    preference: {
      format: {
        anime: DefaultAnimeFormat,
        episode: DefaultEpisodeFormat,
        film: DefaultFilmFormat,
        ova: DefaultFilmFormat
      },
      extension: {
        include: ['mp4', 'mkv'],
        exclude: []
      },
      keyword: {
        order: {
          format: ['mp4', 'mkv'],
          language: ['简', '繁'],
          resolution: ['1080', '720']
        },
        exclude: []
      },
      fansub: {
        order: [],
        exclude: []
      }
    },
    plans: ['./plans/*.yaml'],
    plugins: [
      { name: 'animegarden', provider: 'aria2', directory: './download' },
      { name: 'local', directory: './local' },
      { name: 'bangumi', username: '' }
    ]
  } satisfies RawAnimeSpace;

  await fs.mkdir(root, { recursive: true }).catch(() => {});

  await Promise.all([
    fs.mkdir(space.storage.anime.directory, { recursive: true }).catch(() => {}),
    fs.mkdir(path.join(root, './plans'), { recursive: true }).catch(() => {}),
    fs.mkdir(path.join(root, './download'), { recursive: true }).catch(() => {}),
    fs.mkdir(path.join(root, './local'), { recursive: true }).catch(() => {}),
    fs.writeFile(
      path.join(root, DefaultConfigFilename),
      stringify({
        ...space,
        root: undefined,
        storage: {
          ...space.storage,
          anime: {
            ...space.storage.anime,
            directory: DefaultStorageDirectory
          }
        }
      }),
      'utf-8'
    ),
    fs.writeFile(path.join(root, '.gitignore'), ['*.mp4', '*.mkv', '*.aria2'].join('\n'), 'utf-8'),
    fs.writeFile(path.join(root, 'README.md'), `# AnimeSpace\n`, 'utf-8')
  ]);

  return space;
}
