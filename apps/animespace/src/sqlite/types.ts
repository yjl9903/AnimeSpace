import type { NodeSQLiteDatabase } from 'drizzle-sqlite';

import type { metadata } from './metadata.ts';
import type { torrents } from './torrent.ts';
import type { subjects, subjectFiles } from './subject.ts';
import type { resources, filters, filterResources } from './animegarden.ts';

export type Database = NodeSQLiteDatabase<{
  metadata: typeof metadata;
  subjects: typeof subjects;
  subjectFiles: typeof subjectFiles;
  resources: typeof resources;
  filters: typeof filters;
  filterResources: typeof filterResources;
  torrents: typeof torrents;
}>;
