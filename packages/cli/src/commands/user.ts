import { red, green, dim, lightBlue } from 'kolorist';

import { DOT, logger } from '../logger';

import { app } from './app';

export default function setup() {
  app
    .command('user create', 'Create a new token')
    .option('--comment <comment>', 'Comment of the new token')
    .option('--type <type>', 'One of admin or user')
    .action(async (option) => {
      const { RemoteSyncClient: UserClient } = await import('../client');
      const client = await UserClient.create();
      const token = await client.createToken({
        comment: option.comment,
        type: option.type === 'admin' ? 'admin' : 'user'
      });

      if (token) {
        logger.println(`${green(`✓ Create token OK`)}`);
        logger.tab.println(`${dim('Token')}   ${token.token}`);
        logger.tab.println(`${dim('Type')}    ${token.type}`);
        logger.tab.println(
          `${dim('Comment')} ${token.comment ? token.comment : '(Empty)'}`
        );
      } else {
        logger.println(`${red(`✗ Create token fail`)}`);
      }
    });

  app
    .command('user list', 'List user tokens')
    // .alias('user ls')
    .action(async () => {
      const { RemoteSyncClient: UserClient } = await import('../client');
      const client = await UserClient.create();
      const tokens = await client.listToken();

      if (tokens.length > 0) {
        logger.println(`${green(`✓ There are ${tokens.length} tokens`)}`);
        for (const token of tokens) {
          const comment =
            token.type === 'visitor' && token.access?.length
              ? dim(`(IP: ${token.access[0].ip})`)
              : !!token.comment
              ? dim(`(Comment: ${token.comment})`)
              : '';
          logger.println(
            `${DOT} ${lightBlue(token.type)} ${token.token} ${comment}`
          );
        }
      }
    });

  app
    .command('user remove [token]', 'Remove user tokens')
    // .alias('user rm')
    .option('--visitor', 'Clear all the visitor tokens')
    .action(async (token, option) => {
      const { RemoteSyncClient: UserClient } = await import('../client');
      const client = await UserClient.create();

      if (option.visitor) {
        const tokens = await client.removeVisitors();
        if (tokens !== undefined) {
          logger.println(
            `${green(`✓ Remove ${tokens.length} visitor tokens`)}`
          );
          if (tokens.length > 0) {
            for (const token of tokens) {
              logger.println(`${DOT} ${token}`);
            }
          }
        } else {
          logger.println(`${red(`✗ Remove visitor tokens fail`)}`);
        }
      } else if (token) {
        const ok = await client.removeToken(token);
        if (ok) {
          logger.println(`${green(`✓ Remove ${token}`)}`);
        } else {
          logger.println(`${red(`✗ Remove ${token} fail`)}`);
        }
      }
    });
}
