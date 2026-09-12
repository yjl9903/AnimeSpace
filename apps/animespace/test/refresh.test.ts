import { afterEach, describe, expect, it, vi } from 'vitest';

import { pullSubjects } from '../src/command/refresh.ts';
import { subjects, subjectFiles } from '../src/sqlite/subject.ts';
import { nameResource } from '../src/subject/source/extract.ts';
import { SubjectType } from '../src/subject/source/schema.ts';
import { LocalFS } from '../src/utils/fs.ts';
import { createAnimeSpaceTestKit } from './helpers/animespace.ts';

const kit = createAnimeSpaceTestKit();

afterEach(async () => {
  vi.restoreAllMocks();
  await kit.cleanup();
});

async function setup() {
  const system = await kit.createSystem({ openDatabase: true });
  vi.spyOn(system, 'initializeSource').mockResolvedValue(undefined);
  vi.spyOn(system.logger, 'log').mockImplementation(() => {});
  const error = vi.spyOn(system.logger, 'error').mockImplementation(() => {});
  const subject = kit.createSubjectFromSource(system, { include: ['BEATBREAK'] });
  const database = await system.openDatabase();
  const [row] = await database
    .insert(subjects)
    .values({
      name: subject.name,
      enabled: true,
      source: subject.source,
      naming: subject.naming,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  const resources = [42, 43].map((episode) =>
    nameResource(subject, {
      name: `BEATBREAK - ${episode}`,
      url: `https://example.com/${episode}`,
      metadata: {},
      parsed: { type: SubjectType.TV, episode, fansub: 'LoliHouse' }
    })
  );
  // Resources without provider IDs reproduce existing snapshots that are not
  // attached to fetched resources, even on subsequent pulls.
  vi.spyOn(subject, 'fetchResources').mockResolvedValue(resources);
  const files = [];
  for (const resource of resources) {
    files.push(
      LocalFS.path(
        await kit.writeRootFile(
          system.space.root.path,
          `${resource.extracted.filename}.mkv`,
          'video'
        )
      )
    );
  }
  const storage = LocalFS.path(system.space.root.path);
  vi.spyOn(subject, 'getStorage').mockReturnValue(storage);
  const list = vi.spyOn(storage, 'list').mockResolvedValue(files);
  return { system, subject, database, subjectId: row!.id, files, list, error };
}

describe('pull snapshots', () => {
  it('ignores duplicate storage paths and continues syncing later files', async () => {
    const { system, subject, database, files, list, error } = await setup();
    list.mockResolvedValue([files[0]!, files[0]!, files[1]!]);

    await pullSubjects(system, [subject]);

    expect(error).not.toHaveBeenCalled();
    const rows = await database.select().from(subjectFiles);
    expect(rows.map((row) => row.path).sort()).toEqual(files.map((file) => file.path).sort());
  });

  it('preserves existing snapshots on repeated pulls without resource associations', async () => {
    const { system, subject, database, error } = await setup();
    await pullSubjects(system, [subject]);
    const before = await database.select().from(subjectFiles);

    await pullSubjects(system, [subject]);

    expect(error).not.toHaveBeenCalled();
    expect(await database.select().from(subjectFiles)).toEqual(before);
  });

  it('preserves a conflicting snapshot owned by another subject', async () => {
    const { system, subject, database, files, error } = await setup();
    const [existing] = await database
      .insert(subjectFiles)
      .values({
        subjectId: 999,
        storage: subject.storage.driver,
        path: files[0]!.path,
        size: 123,
        checksum: 'existing-checksum'
      })
      .returning();

    await pullSubjects(system, [subject]);

    expect(error).not.toHaveBeenCalled();
    const rows = await database.select().from(subjectFiles);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === existing!.id)).toEqual(existing);
  });

  it('only reconciles snapshots in the current storage driver', async () => {
    const { system, subject, database, subjectId, files, error } = await setup();
    const elsewhere = await database
      .insert(subjectFiles)
      .values([
        { subjectId, storage: 'other', path: files[0]!.path, checksum: 'keep' },
        { subjectId, storage: 'other', path: '/elsewhere.mkv', checksum: 'keep' }
      ])
      .returning();
    await database.insert(subjectFiles).values({
      subjectId,
      storage: subject.storage.driver,
      path: '/removed.mkv',
      checksum: ''
    });

    await pullSubjects(system, [subject]);

    expect(error).not.toHaveBeenCalled();
    const rows = await database.select().from(subjectFiles);
    expect(rows.filter((row) => row.storage === 'other')).toEqual(elsewhere);
    expect(
      rows
        .filter((row) => row.storage === subject.storage.driver)
        .map((row) => row.path)
        .sort()
    ).toEqual(files.map((file) => file.path).sort());
  });
});
