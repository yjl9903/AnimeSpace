import path from 'pathe';

// import trash from 'trash';
import { z } from 'zod';
import { Path } from 'breadfs';
import { fs as LocalFS } from 'breadfs/node';
import { parse } from 'yaml';
import { format } from 'date-fns';

import type { AnimePlan } from '../plan';
import type { AnimeSystem } from '../system';
import type { AnimeSpace, StoragePath } from '../space';

import { AnimeSystemError, debug } from '../error';
import { formatEpisode, formatTitle, listIncludeFiles } from '../utils';

import type { FormatOptions, LocalFile, LocalLibrary, LocalVideo } from './types';

import { stringifyLocalLibrary } from './utils';

const LibraryFilename = 'library.yaml';

export class Anime {
  public readonly directory: StoragePath;

  public readonly libraryDirectory: StoragePath;

  public readonly relativeDirectory: string;

  public readonly plan: AnimePlan;

  private readonly system: AnimeSystem;

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

  public constructor(system: AnimeSystem, plan: AnimePlan) {
    this.system = system;
    this.plan = plan;

    const space = system.space;
    const dirname = plan.title;

    this.directory = plan.directory
      ? plan.storage.root.resolve(plan.directory)
      : plan.storage.root.join(dirname);

    this.libraryDirectory = plan.directory
      ? space.storage.library.resolve(plan.directory)
      : space.storage.library.join(dirname);

    this.relativeDirectory = plan.directory ? plan.directory : dirname;
  }

  public get space(): AnimeSpace {
    return this.system.space;
  }

  public get delta(): LocalVideoDelta[] {
    return this._delta;
  }

  public get dirty(): boolean {
    return this._dirty;
  }

  public matchKeywords(text: string): boolean {
    for (const ban of this.plan.keywords.exclude) {
      if (text.includes(ban)) {
        return false;
      }
    }
    for (const list of this.plan.keywords.include) {
      if (list.every((keyword) => !text.includes(keyword))) {
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

        const libContent = await libPath.readText().catch(() => libPath.readText()); // Retry at most 1 times
        const lib = parse(libContent) ?? {};
        this._raw_lib = lib;

        const schema = z
          .object({
            title: z.string().default(this.plan.title).catch(this.plan.title),
            season:
              this.plan.season !== undefined
                ? z.coerce.number().default(this.plan.season).catch(this.plan.season)
                : z.coerce.number().optional(),
            date: z.coerce.date().default(this.plan.date).catch(this.plan.date),
            // Hack: for old data, keep this default
            storage: z.string().default('anime'),
            videos: z
              .array(
                z
                  .object({
                    filename: z.string(),
                    naming: z.enum(['auto', 'manual']).default('auto').catch('auto'),
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

          const videos: LocalVideo[] = (lib?.videos ?? []).filter(Boolean);
          // Set default naming 'auto'
          for (const video of videos) {
            if (!video.naming) {
              video.naming = 'auto';
            }
          }

          // TODO: not clear previous storage
          if (this.plan.storage.name !== parsed.data.storage) {
            videos.splice(0, videos.length);
            this._dirty = true;
            parsed.data.storage = this.plan.storage.name;
          }

          this._lib = <LocalLibrary>{
            ...parsed.data,
            videos
          };

          return this._lib;
        } else {
          debug(parsed.error.issues);
          throw new AnimeSystemError(`解析 ${this.plan.title} 的 ${LibraryFilename} 失败`);
        }
      } else {
        const defaultLib: LocalLibrary = {
          title: this.plan.title,
          storage: this.plan.storage.name,
          videos: []
        };

        await libPath.writeText(stringifyLocalLibrary(defaultLib, { videos: [] }));

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
      const files = await listIncludeFiles(this.plan.preference.extension, this.directory);
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
        return this.plan.preference.format.film;
      case 'OVA':
        return this.plan.preference.format.ova;
      case '番剧':
      default:
        return this.plan.preference.format.episode;
    }
  }

  public reformatVideoFilename(video: LocalVideo) {
    if (video.naming === 'auto') {
      const title = this._raw_lib?.title ?? this.plan.rewrite?.title ?? this.plan.title;
      const date = video.date ?? this.plan.date;

      const season = this.resolveSeason(video.season);
      const episode = this.resolveEpisode(video.episode, video.fansub);

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
    const title = this._raw_lib?.title ?? this.plan.rewrite?.title ?? this.plan.title;
    const date = this.plan.date;

    const season = this.resolveSeason(meta.season);
    const episode = this.resolveEpisode(meta.episode, meta.fansub);

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

  public resolveEpisode(episode: number, fansub: string | undefined): number;
  public resolveEpisode(episode: undefined, fansub: string | undefined): undefined;
  public resolveEpisode(
    episode: number | undefined,
    fansub: string | undefined
  ): number | undefined;
  public resolveEpisode(
    episode: number | undefined,
    fansub: string | undefined
  ): number | undefined {
    if (episode !== undefined) {
      const overwrite = this.plan.rewrite?.episode;
      if (overwrite !== undefined) {
        if (overwrite.fansub === undefined || (fansub && overwrite.fansub.includes(fansub))) {
          return episode + overwrite.offset;
        }
      }
      return episode;
    } else {
      return undefined;
    }
  }

  public resolveSeason(season: number): number;
  public resolveSeason(season: undefined): undefined;
  public resolveSeason(season: number | undefined): number | undefined;
  public resolveSeason(season: number | undefined): number | undefined {
    return season ?? this.plan.season;
  }

  // --- mutation ---
  private async addVideo(
    localSrc: string,
    newVideo: LocalVideo,
    { copy = false, onProgress }: { copy?: boolean } & AddVideoOptions = {}
  ): Promise<LocalVideoDelta | undefined> {
    const lib = await this.library();

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

        // Find old video with the same name
        const oldVideoId = lib.videos.findIndex((v) => v.filename === newVideo.filename);
        if (oldVideoId !== -1) {
          const oldVideo = lib.videos[oldVideoId];
          this._delta.push({ operation: 'remove', video: oldVideo });
          this._lib!.videos.splice(oldVideoId, 1);
        }
      }

      this._dirty = true;
      lib.videos.push(newVideo);
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
  public async moveVideo(src: LocalVideo, dst: string): Promise<LocalVideoDelta | undefined> {
    await this.library();
    // Can not move video from other anime
    if (!this._lib!.videos.find((v) => v === src)) return;

    const oldFilename = src.filename;
    const newFilename = dst;
    try {
      if (oldFilename !== newFilename) {
        this._dirty = true;
        await this.directory.join(oldFilename).moveTo(this.directory.join(newFilename));
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

  public async removeVideo(target: LocalVideo): Promise<LocalVideoDelta | undefined> {
    const remove = () => {
      const idx = lib.videos.findIndex((v) => v === target);
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

    if (!lib.videos.find((v) => v === target)) return;

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
    const src = lib.videos.map((v) => v.filename);
    lib.videos.sort((lhs, rhs) => {
      const sl = lhs.season ?? 1;
      const sr = rhs.season ?? 1;
      if (sl !== sr) return sl - sr;
      const el = lhs.episode ?? -1;
      const er = rhs.episode ?? -1;
      return el - er;
    });
    const dst = lib.videos.map((v) => v.filename);
    this._dirty ||= lib.videos.some((_el, idx) => src[idx] !== dst[idx]);
  }

  public async writeLibrary(): Promise<void> {
    for (const plugin of this.space.plugins) {
      await plugin.writeLibrary?.pre?.(this.system, this);
    }

    await this.sortVideos();
    if (this._lib && this._dirty) {
      debug(`Start writing anime library of ${this._lib.title}`);
      try {
        await this.libraryPath.writeText(stringifyLocalLibrary(this._lib!, this._raw_lib));
        this._dirty = false;

        for (const plugin of this.space.plugins) {
          await plugin.writeLibrary?.post?.(this.system, this);
        }

        debug(`Write anime library of ${this._lib.title} OK`);
      } catch (error) {
        console.error(error);
      }
    } else {
      debug(`Keep anime library of ${this.plan.title}`);
    }
  }
}

export interface LocalVideoDelta {
  operation: 'copy' | 'move' | 'remove';

  video: LocalVideo;

  log?: string;
}

export interface AddVideoOptions {
  onProgress?: (payload: { current: number; total: number }) => void;
}
