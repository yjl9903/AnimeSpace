import fs from 'fs-extra';
import path from 'node:path';

import { parse, stringify } from 'yaml';

import { AnimePlan, AnimeSpace } from '../space';

const MetadataFilename = 'metadata.yaml';

export class Anime {
  public readonly directory: string;

  public readonly plan: AnimePlan;

  private readonly space: AnimeSpace;

  private _lib: LocalLibrary | undefined;

  private _files: LocalFile[] | undefined;

  private dirty = false;

  public constructor(space: AnimeSpace, plan: AnimePlan) {
    this.space = space;
    this.directory = path.join(space.storage, plan.title);
    this.plan = plan;
  }

  public async library(force = false) {
    if (this._lib === undefined || force) {
      await fs.ensureDir(this.directory);
      const libPath = path.join(this.directory, MetadataFilename);
      if (await fs.exists(libPath)) {
        const libContent = await fs.readFile(libPath, 'utf-8');
        const lib = parse(libContent) as LocalLibrary;
        return (this.dirty = false), (this._lib = lib);
      } else {
        const lib: LocalLibrary = {
          title: this.plan.title,
          bgmId: this.plan.bgmId,
          videos: []
        };
        await fs.writeFile(libPath, stringify(lib), 'utf-8');
        return (this.dirty = false), (this._lib = lib);
      }
    } else {
      return this._lib;
    }
  }

  public async list(force = false): Promise<LocalFile[]> {
    if (this._files === undefined || force) {
      const exts = new Set(this.space.preference.extension.include);
      const files = (await fs.readdir(this.directory))
        .filter((f) => exts.has(path.extname(f)))
        .map((f) => ({
          filename: f,
          path: path.join(this.directory, f),
          metadata: {}
        }));
      return (this._files = files);
    } else {
      return this._files;
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
