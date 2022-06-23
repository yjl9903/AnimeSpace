import { lightBlue } from 'kolorist';

export function info(message?: string, ...args: any[]) {
  if (message !== undefined) {
    console.log(`  ${lightBlue('Info')} ${message}`, ...args);
  } else {
    console.log();
  }
}
