import fs from 'fs-extra';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import prompts from 'prompts';
import createDebug from 'debug';

const __dirname = path.join(fileURLToPath(import.meta.url), '../');

export const debug = createDebug('anime:cli');

export function getVersion(): string {
  const pkg = path.join(__dirname, '../package.json');
  if (fs.existsSync(pkg)) {
    return JSON.parse(fs.readFileSync(pkg, 'utf-8')).version;
  } else {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
    ).version;
  }
}

export async function promptConfirm(message: string, initial: boolean = true) {
  const { yes } = await prompts(
    {
      type: 'confirm',
      name: 'yes',
      message,
      initial
    },
    {
      onCancel: () => {
        throw new Error('Operation cancelled');
      }
    }
  );
  return yes;
}
