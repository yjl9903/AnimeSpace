import { format } from 'date-fns';
import { BgmClient, BGMCollection } from 'bgmc';

import { ufetch } from './ufetch';

type Item<T> = T extends Array<infer R> ? R : never;

type CollectionItem = Item<NonNullable<BGMCollection.Information['data']>>;

export async function generatePlan(
  username: string,
  options: { create: string | undefined }
) {
  const client = new BgmClient(ufetch, { maxRetry: 1 });
  const collections = await getCollections();

  const output: string[] = [];
  const writeln = (text: string) => {
    if (options.create) {
      output.push(text);
    } else {
      console.log(text);
    }
  };

  const now = new Date();
  writeln(`title: 创建于 ${format(now, 'yyyy-MM-dd hh:mm')}`);
  writeln(``);
  writeln(`date: ${format(now, 'yyyy-MM-dd hh:mm')}`);
  writeln(``);
  writeln(`status: onair`);
  writeln(``);
  writeln(`onair:`);
  for (const anime of collections) {
    const item = await client.subject(anime.subject_id);
    const alias = item.infobox?.find((box) => box.key === '别名');
    const plan = {
      title: item.name_cn || item.name,
      bgmId: '' + anime.subject_id,
      translations: alias?.value.map((v) => v?.v).filter(Boolean)
    };
    writeln(`  - title: ${plan.title}`);
    writeln(`    translations:`);
    for (const t of plan.translations ?? []) {
      writeln(`      - ${t}`);
    }
    writeln(`    bgmId: '${plan.bgmId}'`);
    writeln(``);
  }

  if (options.create) {
  }

  async function getCollections() {
    const list: CollectionItem[] = [];
    while (true) {
      const { data } = await client.getCollections(username, {
        subject_type: 2,
        type: 3,
        limit: 50,
        offset: list.length
      });
      if (data && data.length > 0) {
        list.push(...data);
      } else {
        break;
      }
    }
    return uniqBy(list, (c) => '' + c.subject_id);
  }
}

function uniqBy<T>(arr: T[], map: (el: T) => string): T[] {
  const set = new Set();
  const list: T[] = [];
  for (const item of arr) {
    const key = map(item);
    if (!set.has(key)) {
      set.add(key);
      list.push(item);
    }
  }
  return list;
}
