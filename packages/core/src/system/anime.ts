import fs from 'fs-extra';
import path from 'node:path';

import type { AnitomyResult } from 'anitomy';

import { format } from 'date-fns';
import { parse, stringify } from 'yaml';

import { AnimePlan, AnimeSpace } from '../space';
import { formatTitle, listIncludeFiles } from '../utils';

const MetadataFilename = 'metadata.yaml';

export class Anime {
  public readonly directory: string;

  public readonly plan: AnimePlan;

  private readonly space: AnimeSpace;

  private _lib: LocalLibrary | undefined;

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
    this.directory = path.join(space.storage, dirname);
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

  public async library(force = false) {
    if (this._lib === undefined || force) {
      await fs.ensureDir(this.directory);
      const libPath = path.join(this.directory, MetadataFilename);
      if (await fs.exists(libPath)) {
        const libContent = await fs.readFile(libPath, 'utf-8');
        const lib = parse(libContent) as LocalLibrary;

        if (lib.title !== this.plan.title || lib.bgmId !== this.plan.bgmId) {
          this._dirty = true;
        } else {
          this._dirty = false;
        }

        return (this._lib = {
          ...lib,
          title: this.plan.title,
          bgmId: this.plan.bgmId,
          videos: lib?.videos ?? []
        });
      } else {
        const lib: LocalLibrary = {
          title: this.plan.title,
          bgmId: this.plan.bgmId,
          videos: []
        };
        await fs.writeFile(libPath, stringify(lib), 'utf-8');
        return (this._dirty = false), (this._lib = lib);
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
    return formatTitle(this.format, {
      title: this.plan.title,
      yyyy: format(this.plan.date, 'yyyy'),
      MM: format(this.plan.date, 'MM'),
      ep: video.episode ? String(video.episode) : '{ep}',
      extension: path.extname(video.filename).slice(1) ?? 'mp4',
      fansub: video.fansub ?? 'fansub'
    });
  }

  public formatFilename(meta: {
    episode?: number;
    fansub?: string;
    extension?: string;
  }) {
    return formatTitle(this.format, {
      title: this.plan.title,
      yyyy: '' + this.plan.date.getFullYear(),
      mm: '' + (this.plan.date.getMonth() + 1),
      ep: meta.episode ? String(meta.episode) : '{ep}',
      extension: meta.extension?.toLowerCase() ?? 'mp4',
      fansub: meta.fansub ?? 'fansub'
    });
  }

  // --- mutation ---
  public async addVideo(
    file: string,
    video: LocalVideo,
    { copy = false }: { copy?: boolean } = {}
  ): Promise<void> {
    await this.library();
    try {
      const src = file;
      const dst = path.join(this.directory, video.filename);
      if (src !== dst) {
        if (copy) {
          await fs.copy(file, dst, {
            overwrite: true
          });
        } else {
          await fs.move(file, dst, {
            overwrite: true
          });
        }
      }
      this._dirty = true;
      this._lib!.videos.push(video);
    } catch (error) {
      console.error(error);
    }
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

  public async writeLibrary(): Promise<void> {
    if (this._lib && this._dirty) {
      const libPath = path.join(this.directory, MetadataFilename);
      try {
        await fs.writeFile(
          libPath,
          stringify(this._lib, { lineWidth: 0 }),
          'utf-8'
        );
        this._dirty = false;
      } catch (error) {
        console.error(error);
      }
    }
  }
}

export interface LocalLibrary {
  title: string;

  bgmId: string;

  videos: LocalVideo[];
}

export interface LocalVideo {
  filename: string;

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
