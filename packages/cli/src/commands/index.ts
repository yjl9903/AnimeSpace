import { execSync } from 'node:child_process';

import { context } from '../context';

import { app } from './app';

export { app };

import setupPlan from './plan';
import setupUser from './user';
import setupStore from './store';
import setupMagnet from './magnet';

app
  .command('space', 'Open AnimePaste space directory and run script on it')
  .option('--editor', 'Open AnimePaste space editor')
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
      if (option.editor) {
        execSync(`code "${context.root}"`, {
          env: process.env,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true
        });
      }
    }
  });

setupPlan();
setupUser();
setupStore();
setupMagnet();
