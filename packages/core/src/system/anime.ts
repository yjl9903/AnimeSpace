import fs from 'fs-extra';
import path from 'node:path';

import { z } from 'zod';
import { format } from 'date-fns';
import { Document, parse, visit } from 'yaml';

import { AnimePlan, AnimeSpace } from '../space';
import { debug, AnimeSystemError } from '../error';
import { formatEpisode, formatTitle, listIncludeFiles } from '../utils';

const MetadataFilename = 'metadata.yaml';

export class Anime {
  public readonly directory: string;

  public readonly plan: AnimePlan;

  private readonly space: AnimeSpace;

  private _lib: LocalLibrary | undefined;

  private _raw_lib: Partial<LocalLibrary> | undefined;

  private _files: LocalFile[] | undefined;

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
      ? path.resolve(space.storage, plan.directory)
      : path.join(space.storage, dirname);
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
      if (list.every((keyword) => !text.includes(keyword))) {
        return false;
      }
    }
    return true;
  }

  public async library(force = false): Promise<LocalLibrary> {
    if (this._lib === undefined || force) {
      await fs.ensureDir(this.directory);
      const libPath = path.join(this.directory, MetadataFilename);

      if (await fs.exists(libPath)) {
        // Mark as unmodified
        this._dirty = false;

        const libContent = await fs
          .readFile(libPath, 'utf-8')
          .catch(() => fs.readFile(libPath, 'utf-8')); // Retry at most 1 times
        const lib = parse(libContent);
        this._raw_lib = lib;

        const schema = z
          .object({
            title: z.string().default(this.plan.title).catch(this.plan.title),
            season:
              this.plan.season !== undefined
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
                      .catch('auto')
                  })
                  .passthrough()
              )
              .catch([])
          })
          .passthrough();

        const parsed = schema.safeParse(lib);
        if (parsed.success) {
          return (this._lib = <LocalLibrary>{
            ...parsed.data,
            videos: lib?.videos ?? []
          });
        } else {
          debug(parsed.error.issues);
          throw new AnimeSystemError(
            `解析 ${this.plan.title} 的 metadata.yml 失败`
          );
        }
      } else {
        const defaultLib: LocalLibrary = {
          title: this.plan.title,
          season: this.plan.season,
          date: this.plan.date,
          videos: []
        };
        await fs.writeFile(
          libPath,
          stringifyLocalLibrary(defaultLib, { videos: [] }),
          'utf-8'
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
  private get format() {
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
    const title = this._lib?.title ?? this.plan.title;
    const date = this._lib?.date ?? this.plan.date;
    const season = this._lib?.season ?? this.plan.season;
    return formatTitle(this.format, {
      title,
      yyyy: format(date, 'yyyy'),
      MM: format(date, 'MM'),
      season: season !== undefined ? formatEpisode(season) : '1',
      ep: video.episode !== undefined ? formatEpisode(video.episode) : '{ep}',
      extension: path.extname(video.filename).slice(1) ?? 'mp4',
      fansub: video.fansub ?? 'fansub'
    });
  }

  public formatFilename(meta: {
    season?: number;
    episode?: number;
    fansub?: string;
    extension?: string;
  }) {
    const title = this._lib?.title ?? this.plan.title;
    const date = this._lib?.date ?? this.plan.date;
    const season = meta.season ?? this._lib?.season ?? this.plan.season;
    return formatTitle(this.format, {
      title,
      yyyy: format(date, 'yyyy'),
      mm: format(date, 'MM'),
      season: season !== undefined ? formatEpisode(season) : '1',
      ep: meta.episode !== undefined ? formatEpisode(meta.episode) : '{ep}',
      extension: meta.extension?.toLowerCase() ?? 'mp4',
      fansub: meta.fansub ?? 'fansub'
    });
  }

  // --- mutation ---
  private async addVideo(
    src: string,
    newVideo: LocalVideo,
    { copy = false }: { copy?: boolean } = {}
  ): Promise<void> {
    await this.library();
    try {
      const dst = path.join(this.directory, newVideo.filename);
      if (src !== dst) {
        if (copy) {
          await fs.copy(src, dst, {
            overwrite: true
          });
        } else {
          await fs.move(src, dst, {
            overwrite: true
          });
        }
      }
      this._dirty = true;
      this._lib!.videos.push(newVideo);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Copy a video outside into this library
   *
   * @param src The absolute path of src video
   * @param video The stored video data
   * @returns
   */
  public async addVideoByCopy(src: string, video: LocalVideo): Promise<void> {
    return this.addVideo(src, video, { copy: true });
  }

  /**
   * Move a video outside into this library
   *
   * @param src The absolute path of src video
   * @param video The stored video data
   * @returns
   */
  public async addVideoByMove(src: string, video: LocalVideo): Promise<void> {
    return this.addVideo(src, video, { copy: false });
  }

  public async moveVideo(src: LocalVideo, dst: string): Promise<void> {
    await this.library();
    const oldFilename = src.filename;
    const newFilename = dst;
    src.filename = newFilename;
    try {
      if (oldFilename !== newFilename) {
        await fs.move(
          path.join(this.directory, oldFilename),
          path.join(this.directory, newFilename)
        );
        this._dirty = true;
      }
    } catch (error) {
      src.filename = oldFilename;
      console.error(error);
    }
  }

  public async removeVideo(target: LocalVideo) {
    const remove = () => {
      const idx = lib.videos.findIndex((v) => v === target);
      if (idx !== -1) {
        lib.videos.splice(idx, 1);
        this._dirty = true;
      }
    };

    const lib = await this.library();
    const videoPath = path.join(this.directory, target.filename);
    if (await fs.exists(videoPath)) {
      try {
        // TODO: not delete it, but move to another temp dir
        await fs.remove(videoPath);
        remove();
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
      const el = lhs.episode ?? -1;
      const er = rhs.episode ?? -1;
      return el - er;
    });
    const dst = lib.videos.map((v) => v.filename);
    this._dirty ||= lib.videos.some((_el, idx) => src[idx] !== dst[idx]);
  }

  public async writeLibrary(): Promise<void> {
    if (this._lib && this._dirty) {
      debug(`Start writing anime library of ${this._lib.title}`);
      const libPath = path.join(this.directory, MetadataFilename);
      try {
        await fs.writeFile(
          libPath,
          stringifyLocalLibrary(this._lib!, this._raw_lib),
          'utf-8'
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

export interface LocalLibrary {
  title: string;

  date: Date;

  season?: number;

  videos: LocalVideo[];
}

export interface LocalVideo {
  filename: string;

  naming: 'auto' | 'manual';

  fansub?: string;

  episode?: number;

  source: LocalVideoSource;
}

export interface LocalVideoSource extends Record<string, any> {
  type: string;
}

export interface LocalFile {
  filename: string;

  path: string;

  metadata: Record<string, string>;
}

function stringifyLocalLibrary(
  lib: LocalLibrary,
  rawLib?: Partial<LocalLibrary>
) {
  const copied: LocalLibrary = JSON.parse(JSON.stringify(lib));
  if (rawLib?.title === undefined) {
    // @ts-ignore
    copied.title = undefined;
  }
  if (rawLib?.date === undefined) {
    // @ts-ignore
    copied.date = undefined;
  }
  if (rawLib?.season === undefined) {
    copied.season = undefined;
  }
  if (copied.videos === undefined) {
    copied.videos = [];
  }
  for (const v of copied.videos) {
    if (v.naming === 'auto') {
      // @ts-ignore
      v.naming = undefined;
    }
  }

  const doc = new Document(copied);

  visit(doc, {
    Scalar(key, node) {
      if (key === 'key') {
        node.spaceBefore = true;
      }
    },
    Seq(key, node) {
      let first = true;
      for (const child of node.items) {
        if (first) {
          first = false;
          continue;
        }
        // @ts-ignore
        child.spaceBefore = true;
      }
      return visit.SKIP;
    }
  });

  return (
    `# Generated at ${format(new Date(), 'yyyy-MM-dd hh:mm')}\n` +
    doc.toString({ lineWidth: 0 })
  );
}
