import { AbstractDatabase, DatabaseOption } from '../database';

export class VideoStore extends AbstractDatabase {
  constructor(option: DatabaseOption) {
    super(option);
  }
}
