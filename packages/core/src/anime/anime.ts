import path from 'node:path';

// import trash from 'trash';
import { z } from 'zod';
import { Path } from 'breadfs';
import { fs as LocalFS } from 'breadfs/node';
import { parse } from 'yaml';
import { format } from 'date-fns';

import { AnimePlan, AnimeSpace } from '../space';
import { AnimeSystemError, debug } from '../error';
import { formatEpisode, formatTitle, listIncludeFiles } from '../utils';

import type {
  FormatOptions,
  LocalFile,
  LocalLibrary,
  LocalVideo
} from './types';

import { stringifyLocalLibrary } from './utils';

const LibraryFilename = 'library.yaml';

export class Anime {
  public readonly directory: Path;

  public readonly libraryDirectory: Path;

  public readonly relativeDirectory: string;

  public readonly plan: AnimePlan;

  private readonly space: AnimeSpace;

  private _lib: LocalLibrary | undefined;

  private _raw_lib: Partial<LocalLibrary> | undefined;

  private _files: LocalFile[] | undefined;

  /**
   * Store all the changes made to this anime
   */
  private _delta: LocalVideoDelta[] = [];

  /**
   * Mark whether there is any changes made to this anime that are not writen back
   */
  private _dirty = false;

  public constructor(space: AnimeSpace, plan: AnimePlan) {
    this.space = space;
    this.plan = plan;

    const dirname = formatTitle(space.preference.format.anime, {
      title: plan.title,
      yyyy: format(plan.date, 'yyyy'),
      MM: format(plan.date, 'MM')
    });

    this.directory = plan.directory
      ? space.storage.anime.directory.resolve(plan.directory)
      : space.storage.anime.directory.join(dirname);

    this.libraryDirectory = plan.directory
      ? space.storage.library.directory.resolve(plan.directory)
      : space.storage.library.directory.join(dirname);

    this.relativeDirectory = plan.directory ? plan.directory : dirname;
  }

  public delta() {
    return this._delta;
  }

  public dirty() {
    return this._dirty;
  }

  public matchKeywords(text: string): boolean {
    for (const ban of this.plan.keywords.exclude) {
      if (text.includes(ban)) {
        return false;
      }
    }
    for (const list of this.plan.keywords.include) {
      if (list.every(keyword => !text.includes(keyword))) {
        return false;
      }
    }
    return true;
  }

  public get libraryPath(): Path {
    return this.libraryDirectory.join(LibraryFilename);
  }

  public async library(force = false): Promise<LocalLibrary> {
    if (this._lib === undefined || force) {
      // await fs.ensureDir(this.libraryDirectory);
      await this.libraryDirectory.ensureDir();

      const libPath = this.libraryPath;

      if (await libPath.exists()) {
        // Mark as unmodified
        this._dirty = false;

        const libContent = await libPath
          .readText()
          .catch(() => libPath.readText()); // Retry at most 1 times
        const lib = parse(libContent) ?? {};
        this._raw_lib = lib;

        const schema = z
          .object({
            title: z.string().default(this.plan.title).catch(this.plan.title),
            season: this.plan.season !== undefined
              ? z.coerce
                .number()
                .default(this.plan.season)
                .catch(this.plan.season)
              : z.coerce.number().optional(),
            date: z.coerce.date().default(this.plan.date).catch(this.plan.date),
            videos: z
              .array(
                z
                  .object({
                    filename: z.string(),
                    naming: z
                      .enum(['auto', 'manual'])
                      .default('auto')
                      .catch('auto'),
                    date: z.coerce.date().optional(),
                    season: z.coerce.number().optional(),
                    episode: z.coerce.number().optional()
                  })
                  .passthrough()
              )
              .catch([])
          })
          .passthrough();

        const parsed = schema.safeParse(lib);
        if (parsed.success) {
          debug(parsed.data);

          const videos = (lib?.videos ?? []).filter(Boolean);
          // Set default naming 'auto'
          for (const video of videos) {
            if (!video.naming) {
              video.naming = 'auto';
            }
          }

          return (this._lib = <LocalLibrary> {
            ...parsed.data,
            videos
          });
        } else {
          debug(parsed.error.issues);
          throw new AnimeSystemError(
            `解析 ${this.plan.title} 的 ${LibraryFilename} 失败`
          );
        }
      } else {
        const defaultLib: LocalLibrary = {
          title: this.plan.title,
          season: this.plan.season,
          date: this.plan.date,
          videos: []
        };

        await libPath.writeText(
          stringifyLocalLibrary(defaultLib, { videos: [] })
        );

        this._raw_lib = {};
        this._lib = defaultLib;
        return defaultLib;
      }
    } else {
      return this._lib;
    }
  }

  public async list(force = false): Promise<LocalFile[]> {
    if (this._files === undefined || force) {
      const files = await listIncludeFiles(this.space, this.directory);
      return (this._files = files);
    } else {
      return this._files;
    }
  }

  // --- format ---
  private format(type?: string) {
    type ??= this.plan.type;
    switch (this.plan.type) {
      case '电影':
        return this.space.preference.format.film;
      case 'OVA':
        return this.space.preference.format.ova;
      case '番剧':
      default:
        return this.space.preference.format.episode;
    }
  }

  public reformatVideoFilename(video: LocalVideo) {
    if (video.naming === 'auto') {
      const title = this._raw_lib?.title ?? this.plan.rewrite?.title
        ?? this.plan.title;
      const date = video.date ?? this._lib?.date ?? this.plan.date;
      const season = video.season ?? this._lib?.season ?? this.plan.season;
      const episode = this.resolveEpisode(video.episode);

      return formatTitle(this.format(), {
        title,
        yyyy: format(date, 'yyyy'),
        MM: format(date, 'MM'),
        season: season !== undefined ? formatEpisode(season) : '01',
        ep: episode !== undefined ? formatEpisode(episode) : '{ep}',
        extension: path.extname(video.filename).slice(1) ?? 'mp4',
        fansub: video.fansub ?? 'fansub'
      });
    } else {
      return video.filename;
    }
  }

  public formatFilename(meta: Partial<FormatOptions>) {
    const title = this._raw_lib?.title ?? this.plan.rewrite?.title
      ?? this.plan.title;
    const date = this._lib?.date ?? this.plan.date;
    const season = meta.season ?? this._lib?.season ?? this.plan.season;
    const episode = this.resolveEpisode(meta.episode);

    return formatTitle(this.format(meta.type), {
      title,
      yyyy: format(date, 'yyyy'),
      mm: format(date, 'MM'),
      season: season !== undefined ? formatEpisode(season) : '01',
      ep: episode !== undefined ? formatEpisode(episode) : '{ep}',
      extension: meta.extension?.toLowerCase() ?? 'mp4',
      fansub: meta.fansub ?? 'fansub'
    });
  }

  public resolveEpisode(episode: number): number;
  public resolveEpisode(episode: undefined): undefined;
  public resolveEpisode(episode: number | undefined): number | undefined;
  public resolveEpisode(episode: number | undefined): number | undefined {
    if (episode !== undefined) {
      const overwrite = this.plan.rewrite?.episode;
      if (overwrite !== undefined) {
        if (overwrite.gte <= episode && episode <= overwrite.lte) {
          return episode + overwrite.offset;
        }
      }
      return episode;
    } else {
      return undefined;
    }
  }

  // --- mutation ---
  private async addVideo(
    localSrc: string,
    newVideo: LocalVideo,
    { copy = false, onProgress }: { copy?: boolean } & AddVideoOptions = {}
  ): Promise<LocalVideoDelta | undefined> {
    await this.library();

    let delta: LocalVideoDelta | undefined = undefined;
    try {
      const src = LocalFS.path(localSrc);
      const dst = this.directory.join(newVideo.filename);

      if (src.path !== dst.path) {
        // TODO: trash
        // Trash the existed destination file, not overwrite
        // if (await dst.exists()) {
        //   await trash(dst.path).catch(() => {});
        // }

        if (copy) {
          await src.copyTo(dst, {
            overwrite: true,
            fallback: { file: { write: { onProgress } } }
          });
          delta = { operation: 'copy', video: newVideo };
        } else {
          await src.moveTo(dst, {
            overwrite: true,
            fallback: { file: { write: { onProgress } } }
          });
          delta = { operation: 'move', video: newVideo };
        }
        this._delta.push(delta);
      }

      this._dirty = true;
      this._lib!.videos.push(newVideo);
    } catch (error) {
      console.error(error);
    } finally {
      return delta;
    }
  }

  /**
   * Copy a video outside into this library
   *
   * @param src The absolute path of src video
   * @param video The stored video data
   * @returns
   */
  public async addVideoByCopy(
    src: string,
    video: LocalVideo,
    options: AddVideoOptions = {}
  ): Promise<LocalVideoDelta | undefined> {
    return this.addVideo(src, video, { copy: true });
  }

  /**
   * Move a video outside into this library
   *
   * @param src The absolute path of src video
   * @param video The stored video data
   * @returns
   */
  public async addVideoByMove(
    src: string,
    video: LocalVideo,
    options: AddVideoOptions = {}
  ): Promise<LocalVideoDelta | undefined> {
    return this.addVideo(src, video, { copy: false });
  }

  /**
   * Move the video to the target path
   *
   * @param src The video to be moved
   * @param dst Target path
   */
  public async moveVideo(
    src: LocalVideo,
    dst: string
  ): Promise<LocalVideoDelta | undefined> {
    await this.library();
    // Can not move video from other anime
    if (!this._lib!.videos.find(v => v === src)) return;

    const oldFilename = src.filename;
    const newFilename = dst;
    try {
      if (oldFilename !== newFilename) {
        this._dirty = true;
        await this.directory
          .join(oldFilename)
          .moveTo(this.directory.join(newFilename));
        // await fs.move(
        //   path.join(this.directory, oldFilename),
        //   path.join(this.directory, newFilename)
        // );
        src.filename = newFilename;
        const delta = { operation: 'move', video: src } as const;
        this._delta.push(delta);
        return delta;
      }
    } catch (error) {
      src.filename = oldFilename;
      console.error(error);
    }
  }

  public async removeVideo(
    target: LocalVideo
  ): Promise<LocalVideoDelta | undefined> {
    const remove = () => {
      const idx = lib.videos.findIndex(v => v === target);
      if (idx !== -1) {
        const oldVideo = lib.videos[idx];
        lib.videos.splice(idx, 1);
        this._dirty = true;
        const delta = { operation: 'remove', video: oldVideo } as const;
        this._delta.push(delta);
        return delta;
      }
    };

    const lib = await this.library();
    const video = this.directory.join(target.filename);
    if (await video.exists()) {
      try {
        // TODO: trash
        // await trash(videoPath).catch(async err => {
        //   await fs.remove(videoPath);
        // });
        await video.remove();
        return remove();
      } catch (error) {
        console.error(error);
      }
    } else {
      remove();
    }
  }

  public async sortVideos() {
    const lib = await this.library();
    const src = lib.videos.map(v => v.filename);
    lib.videos.sort((lhs, rhs) => {
      const el = lhs.episode ?? -1;
      const er = rhs.episode ?? -1;
      return el - er;
    });
    const dst = lib.videos.map(v => v.filename);
    this._dirty ||= lib.videos.some((_el, idx) => src[idx] !== dst[idx]);
  }

  public async writeLibrary(): Promise<void> {
    await this.sortVideos();
    if (this._lib && this._dirty) {
      debug(`Start writing anime library of ${this._lib.title}`);
      try {
        await this.libraryPath.writeText(
          stringifyLocalLibrary(this._lib!, this._raw_lib)
        );
        this._dirty = false;
        debug(`Write anime library of ${this._lib.title} OK`);
      } catch (error) {
        console.error(error);
      }
    } else {
      debug(`Keep anime library of ${this.plan.title}`);
    }
  }
}

interface LocalVideoDelta {
  operation: 'copy' | 'move' | 'remove';

  video: LocalVideo;

  log?: string;
}

interface AddVideoOptions {
  onProgress?: (payload: { current: number; total: number }) => void;
}
