import { execSync } from 'node:child_process';

import { context } from '../context';

import { app } from './app';

export { app };

import './plan';
import './store';
import './user';
import './magnet';

app
  .command('space', 'Open AnimePaste space directory and run script on it')
  .action(async (option) => {
    const cmd = option['--'];
    if (cmd.length > 0) {
      execSync(cmd.join(' '), {
        cwd: context.root,
        env: process.env,
        stdio: ['inherit', 'inherit', 'inherit']
      });
    } else {
      console.log(context.root);
      execSync(`code "${context.root}"`, {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });
    }
  });
