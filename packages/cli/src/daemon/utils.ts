import { lightBlue, lightRed } from 'kolorist';

export function info(message?: string, ...args: any[]) {
  if (message !== undefined) {
    console.log(`  ${lightBlue('Info')} ${message}`, ...args);
  } else {
    console.log();
  }
}

export function error(message: string, ...args: any[]) {
  console.log(`  ${lightRed('Error')} ${message}`, ...args);
}
