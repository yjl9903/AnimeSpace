import path from 'node:path';
import { existsSync, readFileSync } from 'fs-extra';

import prompts from 'prompts';
import createDebug from 'debug';

export const debug = createDebug('anime:cli');

export function getVersion(): string {
  const pkg = path.join(__dirname, '../package.json');
  if (existsSync(pkg)) {
    return JSON.parse(readFileSync(pkg, 'utf-8')).version;
  } else {
    return JSON.parse(
      readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
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
