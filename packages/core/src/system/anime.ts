import fs from 'fs-extra';
import path from 'node:path';

import type { AnitomyResult } from 'anitomy';

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
      yyyy: '' + plan.date.getFullYear(),
      mm: '' + (plan.date.getMonth() + 1)
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
        return (this._dirty = false), (this._lib = lib);
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

  public formatFilename(meta: AnitomyResult) {
    const format = () => {
      switch (this.plan.type) {
        case '电影':
          return this.space.preference.format.film;
        case 'OVA':
          return this.space.preference.format.ova;
        case '番剧':
        default:
          return this.space.preference.format.episode;
      }
    };
    return formatTitle(format(), {
      title: this.plan.title,
      yyyy: '' + this.plan.date.getFullYear(),
      mm: '' + (this.plan.date.getMonth() + 1),
      ep: meta.episode.number ? String(meta.episode.number) : '{ep}',
      extension: meta.file.extension ?? 'mp4',
      fansub: meta.release.group ?? 'fansub'
    });
  }

  // --- mutation ---
  public async moveVideo(file: LocalFile, video: LocalVideo): Promise<void> {
    await this.library();
    await fs.move(file.path, path.join(this.directory, video.filename));
    this._dirty = true;
    this._lib!.videos.push(video);
  }

  public async writeLibrary(): Promise<void> {
    if (this._lib && this._dirty) {
      const libPath = path.join(this.directory, MetadataFilename);
      await fs.writeFile(libPath, stringify(this._lib), 'utf-8');
      this._dirty = false;
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

export type LocalVideoSource = any;

export interface LocalFile {
  filename: string;

  path: string;

  metadata: {};
}
