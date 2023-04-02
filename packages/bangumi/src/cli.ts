import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { breadc } from 'breadc';

import { version } from '../package.json';

import type { ExtendBangumi, BangumiType } from './core/types';

const bangumi = breadc('bangumi', { version });

bangumi
  .command('<output>')
  .option('--begin <begin>', 'Begin date')
  .option('--end <end>', 'End date')
  .option('--type <type>', 'Filter bangumi types', { default: '' })
  .option('--fields <fileds>', 'Enable extension fields', { default: '' })
  .option('--compress', 'Enable compress')
  .action(async (name, option) => {
    const { transform } = await import('./transform');

    const data = await transform({
      begin: option.begin,
      end: option.end,
      type: option.type.split(',') as BangumiType[],
      fields: option.fields.split(',') as Array<keyof ExtendBangumi>,
      compress: option.compress
    });

    const dataPath = path.join(fileURLToPath(import.meta.url), '../../data');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath);
    }

    const filename = name ?? 'data.json';
    fs.writeFileSync(
      path.join(
        dataPath,
        filename.endsWith('.json') ? filename : filename + '.json'
      ),
      JSON.stringify(data),
      'utf8'
    );
  });

bangumi.run(process.argv.slice(2)).catch((err) => console.error(err));
