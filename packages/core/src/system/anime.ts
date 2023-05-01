import path from 'node:path';

import { AnimePlan, AnimeSpace } from '../space';

export class Anime {
  public readonly directory: string;

  public readonly plan: AnimePlan;

  constructor(space: AnimeSpace, plan: AnimePlan) {
    this.directory = path.join(space.storage, plan.title);
    this.plan = plan;
  }
}
